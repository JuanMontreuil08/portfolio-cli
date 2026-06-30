import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { type Project } from '../../core/schema.js';
import { type AiState } from '../App.js';
import { theme } from '../theme.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function Spinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(t);
  }, []);
  return <Text color={theme.accent}>{SPINNER_FRAMES[frame]}</Text>;
}

interface ProjectDetailProps {
  project: Project;
  ai: AiState;
}

export default function ProjectDetail({ project, ai }: ProjectDetailProps) {
  const loading = ai.status === 'loading';
  const streaming = ai.status === 'streaming';
  const active = loading || streaming;

  return (
    <Box flexDirection="column" gap={1}>

      {/* Title + spinner */}
      <Box gap={1}>
        <Text bold color={theme.accent}>▸ {project.title}</Text>
        {active && (
          <>
            <Spinner />
            <Text dimColor>analyzing repo...</Text>
          </>
        )}
      </Box>

      {/* AI summary text — streams in */}
      {ai.text.length > 0 && (
        <Box paddingLeft={2}>
          <Text wrap="wrap">{ai.text}</Text>
        </Box>
      )}

      {/* Commits — appear as soon as fetch is done */}
      {ai.commits.length > 0 && (
        <Box flexDirection="column" paddingLeft={2} gap={0}>
          <Text dimColor>recent commits</Text>
          {ai.commits.map((c, i) => (
            <Box key={i} flexDirection="column">
              <Box gap={2}>
                <Text dimColor>{c.date}</Text>
                <Text dimColor>[{c.branch}]</Text>
              </Box>
              <Box paddingLeft={2}>
                <Text dimColor wrap="wrap">{c.message}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Error */}
      {ai.status === 'error' && (
        <Box paddingLeft={2}>
          <Text color="red">⚠ could not fetch repo data</Text>
        </Box>
      )}

    </Box>
  );
}
