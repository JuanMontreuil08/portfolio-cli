import React from 'react';
import { render } from 'ink';
import { loadPortfolio } from '../core/load.js';
import App from './App.js';

const portfolio = loadPortfolio();

const { waitUntilExit } = render(<App portfolio={portfolio} />, {
  exitOnCtrlC: true,
  alternateScreen: true,
});

await waitUntilExit();
