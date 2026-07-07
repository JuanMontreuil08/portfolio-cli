import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { theme } from './theme.js';

const logoPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/logo.txt');
const logoText = fs.readFileSync(logoPath, 'utf8');
const lines = logoText.split('\n');
const maxCol = Math.max(...lines.map(l => l.length));

const WAVE_WIDTH = 8;
const PERIOD = maxCol + WAVE_WIDTH + 6;

interface LogoProps {
  paused?: boolean;
}

export default function Logo({ paused = false }: LogoProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setFrame(f => (f + 1) % PERIOD), 80);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <Box flexDirection="column" flexShrink={0}>
      {lines.map((line, lineIdx) => {
        // Group consecutive chars by lit/unlit into segments.
        // Reduces ANSI codes per frame from ~100 to ~20-30.
        const segments: { text: string; lit: boolean }[] = [];
        for (const [colIdx, char] of line.split('').entries()) {
          if (char === ' ') {
            const last = segments[segments.length - 1];
            if (last) { last.text += char; }
            else { segments.push({ text: char, lit: false }); }
            continue;
          }
          const pos = ((frame - colIdx) % PERIOD + PERIOD) % PERIOD;
          const lit = pos < WAVE_WIDTH;
          const last = segments[segments.length - 1];
          if (last && last.lit === lit) { last.text += char; }
          else { segments.push({ text: char, lit }); }
        }

        return (
          <Text key={lineIdx}>
            {segments.map((seg, i) =>
              seg.lit ? (
                <Text key={i} color={theme.accent} bold>{seg.text}</Text>
              ) : (
                <Text key={i} dimColor>{seg.text}</Text>
              )
            )}
          </Text>
        );
      })}
    </Box>
  );
}
