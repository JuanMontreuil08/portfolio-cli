import React, { useState, useEffect } from 'react';
import { Box, Text, useWindowSize } from 'ink';
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

interface ProjectDetailProps {
  project: Project;
  ai: AiState;
  scrollOffset: number;
}

export default function ProjectDetail({ project, ai, scrollOffset }: ProjectDetailProps) {
  const { columns, rows } = useWindowSize();
  const loading = ai.status === 'loading';
  const streaming = ai.status === 'streaming';
  const active = loading || streaming;

  const showLogo = columns >= 90;
  const contentWidth = Math.max(30, columns - (showLogo ? 40 : 4));

  // Build flat line list (everything except the pinned title)
  type Line = { text: string; color?: string; bold?: boolean; dim?: boolean };
  const allLines: Line[] = [];

  if (active) {
    allLines.push({ text: '  analyzing repo...', dim: true });
  }

  if (ai.text.length > 0) {
    allLines.push({ text: '' });
    const paragraphs = ai.text.split('\n');
    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p].trim();
      if (para.length === 0) {
        allLines.push({ text: '' });
      } else {
        for (const line of wrapText(para, contentWidth - 2)) {
          allLines.push({ text: `  ${line}` });
        }
      }
    }
  }

  if (ai.status === 'done' && ai.commits.length > 0) {
    allLines.push({ text: '' });
    allLines.push({ text: 'recent commits', dim: true });
    for (const c of ai.commits) {
      allLines.push({ text: `${c.date}  [${c.branch}]`, dim: true });
      allLines.push({ text: `  ${c.message}`, dim: true });
    }
  }

  if (ai.status === 'error') {
    allLines.push({ text: '⚠ could not fetch repo data', color: 'red' });
  }

  // Title takes 1 row + 1 gap + indicators = ~3 rows overhead
  const availableRows = Math.max(3, rows - 5);
  const maxOffset = Math.max(0, allLines.length - availableRows);
  const clampedOffset = Math.min(scrollOffset, maxOffset);
  const visible = allLines.slice(clampedOffset, clampedOffset + availableRows);

  const canScrollUp = clampedOffset > 0;
  const canScrollDown = clampedOffset < maxOffset;

  return (
    <Box flexDirection="column">

      {/* Title — always pinned, spinner animates here while loading */}
      <Box gap={1}>
        <Text bold color={theme.accent}>▸ {project.title}</Text>
        {active && <Spinner />}
        {canScrollUp && <Text dimColor>  ↑</Text>}
        {canScrollDown && <Text dimColor>  ↓</Text>}
      </Box>

      {/* Scrollable content window */}
      {visible.map((line, i) => (
        <Box key={`${clampedOffset}-${i}`}>
          {line.text === '' ? (
            <Text> </Text>
          ) : (
            <Text color={line.color} bold={line.bold} dimColor={line.dim}>
              {line.text}
            </Text>
          )}
        </Box>
      ))}

    </Box>
  );
}
