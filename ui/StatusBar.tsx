import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { theme } from './theme.js';

interface StatusBarProps {
  detailOpen?: boolean;
}

export default function StatusBar({ detailOpen }: StatusBarProps) {
  const { columns } = useWindowSize();
  const left = 'v0.1.0';

  if (detailOpen) {
    const right = 'esc back';
    const gap = Math.max(1, columns - left.length - right.length - 4);
    return (
      <Box paddingX={2} paddingBottom={0}>
        <Text dimColor>{left}</Text>
        <Text>{' '.repeat(gap)}</Text>
        <Text dimColor>esc </Text><Text color={theme.accent}>back</Text>
      </Box>
    );
  }

  const right = '↹ navigate   ↵ select   q quit';
  const gap = Math.max(1, columns - left.length - right.length - 4);

  return (
    <Box paddingX={2} paddingBottom={0}>
      <Text dimColor>{left}</Text>
      <Text>{' '.repeat(gap)}</Text>
      <Text dimColor>↹ </Text><Text color={theme.accent}>navigate</Text>
      <Text dimColor>   ↵ </Text><Text color={theme.accent}>select</Text>
      <Text dimColor>   q </Text><Text color={theme.accent}>quit</Text>
    </Box>
  );
}
