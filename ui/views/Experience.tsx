import React from 'react';
import { Box, Text } from 'ink';
import { type Experience } from '../../core/schema.js';
import { theme } from '../theme.js';

interface ExperienceProps {
  experience: Experience[];
  selectedIndex: number;
}

export default function ExperienceView({ experience, selectedIndex }: ExperienceProps) {
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
                <Text dimColor wrap="wrap">  {e.summary.trim()}</Text>
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
