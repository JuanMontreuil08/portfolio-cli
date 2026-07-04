import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { type Portfolio } from '../../core/schema.js';
import { theme } from '../theme.js';

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

interface AboutProps {
  portfolio: Portfolio;
}

export default function About({ portfolio }: AboutProps) {
  const { columns } = useWindowSize();
  const showLogo = columns >= 90;
  const contentWidth = Math.max(30, columns - (showLogo ? 40 : 4));

  const paragraphs = portfolio.bio.split('\n').filter(l => l.trim() !== '');

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold color={theme.accent}>{portfolio.name}</Text>
        <Text dimColor>
          {[portfolio.headline, portfolio.location].filter(Boolean).join('  ·  ')}
        </Text>
      </Box>

      {paragraphs.map((paragraph, i) => (
        <Box key={i} flexDirection="column">
          {wrapText(paragraph.trim(), contentWidth).map((line, j) => (
            <Text key={j}>{line}</Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
