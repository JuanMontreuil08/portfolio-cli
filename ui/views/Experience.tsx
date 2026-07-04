import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { type Experience } from '../../core/schema.js';
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

interface ExperienceProps {
  experience: Experience[];
  selectedIndex: number;
}

export default function ExperienceView({ experience, selectedIndex }: ExperienceProps) {
  const { columns } = useWindowSize();
  const showLogo = columns >= 90;
  const contentWidth = Math.max(30, columns - (showLogo ? 42 : 6));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Experience</Text>
      {experience.map((e, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={`${e.company}-${i}`} flexDirection="column" paddingLeft={isSelected ? 0 : 1}>
            {isSelected ? (
              <Box flexDirection="column">
                <Text bold color={theme.accent}>▸ {e.role}  <Text dimColor>{e.company}</Text></Text>
                <Text dimColor>  {e.period}</Text>
                {wrapText(e.summary.trim(), contentWidth - 4).map((line, j) => (
                  <Text key={j} dimColor>  {line}</Text>
                ))}
              </Box>
            ) : (
              <Text dimColor>  {e.role}  ·  {e.company}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
