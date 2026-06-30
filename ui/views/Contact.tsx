import React from 'react';
import { Box, Text } from 'ink';
import { type Portfolio } from '../../core/schema.js';
import { theme } from '../theme.js';

interface ContactProps {
  portfolio: Portfolio;
  selectedIndex: number;
}

export default function Contact({ portfolio, selectedIndex }: ContactProps) {
  const items = [
    portfolio.contact ? { label: '✉', value: portfolio.contact } : null,
    portfolio.links?.github ? { label: 'gh', value: portfolio.links.github } : null,
    portfolio.links?.x ? { label: 'x', value: portfolio.links.x } : null,
    portfolio.links?.linkedin ? { label: 'in', value: portfolio.links.linkedin } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Contact</Text>
      {items.map((item, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={item.label}>
            {isSelected
              ? <Text bold color={theme.accent}>▸ {item.label}  {item.value}</Text>
              : <Text dimColor>  {item.label}  {item.value}</Text>
            }
          </Box>
        );
      })}
    </Box>
  );
}
