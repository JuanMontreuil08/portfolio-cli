import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { theme } from './theme.js';

const logoPath = path.resolve(fileURLToPath(import.meta.url), '../../assets/logo.txt');
const logoText = fs.readFileSync(logoPath, 'utf8');
const lines = logoText.split('\n');
const maxCol = Math.max(...lines.map(l => l.length));

const WAVE_WIDTH = 8;
const PERIOD = maxCol + WAVE_WIDTH + 6;

export default function Logo() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % PERIOD), 80);
    return () => clearInterval(t);
  }, []);

  return (
    <Box flexDirection="column" flexShrink={0}>
      {lines.map((line, lineIdx) => (
        <Text key={lineIdx}>
          {line.split('').map((char, colIdx) => {
            if (char === ' ') return char;
            const pos = ((frame - colIdx) % PERIOD + PERIOD) % PERIOD;
            const lit = pos < WAVE_WIDTH;
            return (
              <Text key={colIdx} color={lit ? theme.accent : undefined} bold={lit} dimColor={!lit}>
                {char}
              </Text>
            );
          })}
        </Text>
      ))}
    </Box>
  );
}
