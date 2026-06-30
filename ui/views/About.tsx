import React from 'react';
import { Box, Text } from 'ink';
import { type Portfolio } from '../../core/schema.js';
import { theme } from '../theme.js';

interface AboutProps {
  portfolio: Portfolio;
}

export default function About({ portfolio }: AboutProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold color={theme.accent}>{portfolio.name}</Text>
        <Text dimColor>
          {[portfolio.headline, portfolio.location].filter(Boolean).join('  ·  ')}
        </Text>
      </Box>

      {portfolio.bio.split('\n').filter(l => l.trim() !== '').map((paragraph, i) => (
        <Text key={i} wrap="wrap">{paragraph.trim()}</Text>
      ))}
    </Box>
  );
}
