import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import ssh2 from 'ssh2';
const { Server } = ssh2;

// Chalk detects color level once at import using process.stdout.
// Under PM2 / Oracle, stdout is not a TTY so it defaults to level 0 (no colors).
// Setting the singleton here forces truecolor for all renders including Ink's colorize.js.
chalk.level = 3;
import fs from 'fs';
import { loadPortfolio } from '../core/load.js';
import App from '../ui/App.js';

// Fail fast at startup — better than crashing mid-connection
const portfolio = loadPortfolio();

let hostKey: Buffer | string;
if (process.env.HOST_KEY) {
  hostKey = process.env.HOST_KEY;
} else {
  const hostKeyPath = process.env.HOST_KEY_PATH ?? 'host.key';
  if (!fs.existsSync(hostKeyPath)) {
    console.error(`host.key not found at: ${hostKeyPath}`);
    process.exit(1);
  }
  hostKey = fs.readFileSync(hostKeyPath);
}

// Patch an ssh2 stream so Ink treats it as a real TTY.
// Pattern from github.com/whoisarpit/ssh-coffee-shop
function makeInkCompatible(stream: any, cols: number, rows: number) {
  stream.isTTY    = true;
  stream.columns  = cols;
  stream.rows     = rows;
  stream.setRawMode = () => stream;
  stream.ref        = () => stream;
  stream.unref      = () => stream;

  Object.defineProperty(stream, 'isRaw', {
    get: () => true,
    set: () => {},
    enumerable: true,
    configurable: true,
  });

  if (!stream.removeListener) stream.removeListener = stream.off;

  // Ink writes bare \n but SSH terminals need \r\n.
  // Without \r the cursor doesn't return to column 0 — content drifts right.
  const _write = stream.write.bind(stream);
  stream.write = (data: any, encoding?: any, callback?: any): boolean => {
    if (typeof data === 'string') {
      data = data.replace(/(?<!\r)\n/g, '\r\n');
    }
    return _write(data, encoding, callback);
  };
}

const server = new Server({ hostKeys: [hostKey] }, (client) => {
  // Rate limiting hook — extend here (e.g. check client.socket.remoteAddress)

  client.on('authentication', (ctx) => ctx.accept());

  client.on('ready', () => {
    client.on('session', (acceptSession) => {
      const session = acceptSession();
      let cols = 80;
      let rows = 24;

      session.on('pty', (accept, _reject, info) => {
        cols = info.cols || 80;
        rows = info.rows || 24;
        accept();
      });

      session.on('shell', (accept) => {
        const stream = accept();

        makeInkCompatible(stream, cols, rows);

        const { unmount, waitUntilExit } = render(
          <App portfolio={portfolio} />,
          {
            stdout: stream as unknown as NodeJS.WriteStream,
            stdin:  stream as unknown as NodeJS.ReadStream,
            exitOnCtrlC: false,
            alternateScreen: true,
          },
        );

        // When the user presses q, close the SSH stream so the client returns to its shell
        waitUntilExit().then(() => stream.end()).catch(() => stream.end());

        // Translate ssh2 window-change → Ink resize
        stream.on('window-change', (info: any) => {
          (stream as any).columns = info.cols;
          (stream as any).rows    = info.rows;
          stream.emit('resize');
        });

        stream.on('close', () => unmount());
        stream.on('error', () => unmount());
      });
    });
  });

  client.on('error', (err: Error) => {
    console.error('Client error:', err.message);
  });
});

server.on('error', (err: Error) => {
  console.error('Server error:', err.message);
});

const port = Number(process.env.PORT) || 2222;
server.listen(port, '0.0.0.0', () => {
  console.log(`SSH server listening on port ${port}`);
});
