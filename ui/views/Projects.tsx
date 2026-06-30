import React from 'react';
import { Box, Text } from 'ink';
import { type Project } from '../../core/schema.js';
import { theme } from '../theme.js';

interface ProjectsProps {
  projects: Project[];
  selectedIndex: number;
}

export default function Projects({ projects, selectedIndex }: ProjectsProps) {
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
                  <Text dimColor wrap="wrap">{p.description.trim()}</Text>
                  <Text dimColor>{p.stack.join(' · ')}</Text>
                  {p.repo && <Text dimColor>{p.repo}</Text>}
                  {p.lastCommit && <Text dimColor>last commit: {p.lastCommit}</Text>}
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
