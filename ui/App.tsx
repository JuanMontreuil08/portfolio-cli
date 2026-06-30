import React, { useState, useRef } from 'react';
import { Box, useInput, useApp, useWindowSize } from 'ink';
import { type Portfolio } from '../core/schema.js';
import { fetchRepoData, type CommitInfo } from '../core/github.js';
import { streamSummary } from '../core/summarize.js';
import Logo from './Logo.js';
import Nav, { type Section, SECTIONS } from './Nav.js';
import StatusBar from './StatusBar.js';
import About from './views/About.js';
import Projects from './views/Projects.js';
import ProjectDetail from './views/ProjectDetail.js';
import ExperienceView from './views/Experience.js';
import Contact from './views/Contact.js';

interface AppProps {
  portfolio: Portfolio;
}

export type AiStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface AiState {
  status: AiStatus;
  text: string;
  commits: CommitInfo[];
}

const IDLE_AI: AiState = { status: 'idle', text: '', commits: [] };

export default function App({ portfolio }: AppProps) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();
  const [section, setSection] = useState<Section>('about');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [ai, setAi] = useState<AiState>(IDLE_AI);
  const abortRef = useRef<AbortController | null>(null);

  const contactCount = [
    portfolio.contact,
    portfolio.links?.github,
    portfolio.links?.x,
    portfolio.links?.linkedin,
  ].filter(Boolean).length;

  const maxIndex =
    section === 'projects' ? portfolio.projects.length - 1
    : section === 'experience' ? portfolio.experience.length - 1
    : section === 'contact' ? contactCount - 1
    : 0;

  const openDetail = (repoUrl: string) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setAi({ status: 'loading', text: '', commits: [] });
    setDetailOpen(true);

    (async () => {
      try {
        const data = await fetchRepoData(repoUrl);
        if (abort.signal.aborted) return;

        setAi(prev => ({ ...prev, status: 'streaming', commits: data.commits }));

        for await (const chunk of streamSummary(data)) {
          if (abort.signal.aborted) return;
          setAi(prev => ({ ...prev, text: prev.text + chunk }));
        }

        if (!abort.signal.aborted) {
          setAi(prev => ({ ...prev, status: 'done' }));
        }
      } catch {
        if (!abort.signal.aborted) {
          setAi(prev => ({ ...prev, status: 'error' }));
        }
      }
    })();
  };

  const closeDetail = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setDetailOpen(false);
    setAi(IDLE_AI);
  };

  useInput((input, key) => {
    if (detailOpen) {
      if (key.escape || input === 'b') closeDetail();
      return;
    }

    if (input === 'q') exit();

    if (key.rightArrow || key.tab) {
      const i = SECTIONS.indexOf(section);
      setSection(SECTIONS[(i + 1) % SECTIONS.length]);
      setSelectedIndex(0);
    }
    if (key.leftArrow || (key.shift && key.tab)) {
      const i = SECTIONS.indexOf(section);
      setSection(SECTIONS[(i - 1 + SECTIONS.length) % SECTIONS.length]);
      setSelectedIndex(0);
    }
    if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIndex(i => Math.min(maxIndex, i + 1));

    if (key.return && section === 'projects') {
      const proj = portfolio.projects[selectedIndex];
      if (proj?.repo) openDetail(proj.repo);
    }
  });

  const logoWidth = 32;
  const gap = 4;
  const contentWidth = Math.max(30, columns - logoWidth - gap - 4);

  return (
    <Box flexDirection="column" minHeight={rows}>
      <Box flexDirection="row" paddingX={2} paddingTop={1} gap={gap}>
        <Box width={logoWidth} flexShrink={0}>
          <Logo />
        </Box>
        <Box flexDirection="column" gap={1} width={contentWidth}>
          {detailOpen ? (
            <ProjectDetail project={portfolio.projects[selectedIndex]} ai={ai} />
          ) : (
            <>
              {section === 'about' && <About portfolio={portfolio} />}
              {section === 'projects' && (
                <Projects projects={portfolio.projects} selectedIndex={selectedIndex} />
              )}
              {section === 'experience' && (
                <ExperienceView experience={portfolio.experience} selectedIndex={selectedIndex} />
              )}
              {section === 'contact' && <Contact portfolio={portfolio} selectedIndex={selectedIndex} />}
              <Box marginTop={1}>
                <Nav active={section} />
              </Box>
            </>
          )}
        </Box>
      </Box>
      <Box marginTop={1}>
        <StatusBar detailOpen={detailOpen} />

      </Box>
    </Box>
  );
}
