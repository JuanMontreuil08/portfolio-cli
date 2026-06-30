import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.js';

export type Section = 'about' | 'projects' | 'experience' | 'contact';

export const SECTIONS: Section[] = ['about', 'projects', 'experience', 'contact'];

const LABELS: Record<Section, string> = {
  about: 'About',
  projects: 'Projects',
  experience: 'Experience',
  contact: 'Contact',
};

interface NavProps {
  active: Section;
}

export default function Nav({ active }: NavProps) {
  return (
    <Box>
      <Text wrap="truncate">
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <Text dimColor>  ·  </Text>}
            <Text bold={s === active} color={s === active ? theme.accent : undefined} dimColor={s !== active}>
              {LABELS[s]}
            </Text>
          </React.Fragment>
        ))}
      </Text>
    </Box>
  );
}
