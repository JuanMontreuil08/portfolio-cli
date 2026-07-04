import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { type Project } from '../../core/schema.js';
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

interface ProjectsProps {
  projects: Project[];
  selectedIndex: number;
}

export default function Projects({ projects, selectedIndex }: ProjectsProps) {
  const { columns } = useWindowSize();
  const showLogo = columns >= 90;
  const contentWidth = Math.max(30, columns - (showLogo ? 42 : 6));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Projects</Text>
      {projects.map((p, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={p.title} flexDirection="column">
            {isSelected ? (
              <Box flexDirection="column" gap={1}>
                <Text bold color={theme.accent}>▸ {p.title}</Text>
                <Box flexDirection="column" paddingLeft={2}>
                  {wrapText(p.description.trim(), contentWidth - 4).map((line, j) => (
                    <Text key={j} dimColor>{line}</Text>
                  ))}
                  <Text bold color={theme.accent}><Text dimColor>{p.stack.join(' · ')}</Text></Text>
                  {p.repo && <Text dimColor>{p.repo}</Text>}
                </Box>
              </Box>
            ) : (
              <Text dimColor>  {p.title}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
