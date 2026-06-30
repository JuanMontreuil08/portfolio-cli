export interface CommitInfo {
  sha: string;
  message: string; // first line only, max 72 chars
  date: string;    // YYYY-MM-DD
  branch: string;
}

export interface RepoData {
  readme: string;
  languages: string[];
  commits: CommitInfo[];
}

const HEADERS = { 'User-Agent': 'terminal-portfolio' };

function parseSlug(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/#?]+)/);
  if (!match) throw new Error(`Not a GitHub URL: ${repoUrl}`);
  return match[1];
}

export async function fetchRepoData(repoUrl: string): Promise<RepoData> {
  const slug = parseSlug(repoUrl);
  const base = `https://api.github.com/repos/${slug}`;

  // Fetch README, languages, and branch list in parallel
  const [readmeRes, langsRes, branchesRes] = await Promise.all([
    fetch(`${base}/readme`, { headers: HEADERS }),
    fetch(`${base}/languages`, { headers: HEADERS }),
    fetch(`${base}/branches?per_page=10`, { headers: HEADERS }),
  ]);

  // README — base64 encoded, truncate to 2000 chars
  // Treat as empty if content is too short to be meaningful (e.g. just a title)
  let readme = '';
  if (readmeRes.ok) {
    const data = await readmeRes.json() as { content: string };
    const raw = Buffer.from(data.content, 'base64').toString('utf-8');
    const stripped = raw.replace(/[#\s*_`]/g, '').trim();
    if (stripped.length >= 100) {
      readme = raw.slice(0, 2000);
    }
  }

  // Languages
  let languages: string[] = [];
  if (langsRes.ok) {
    const data = await langsRes.json() as Record<string, number>;
    languages = Object.keys(data);
  }

  // Branches — limit to 5 to avoid hitting rate limits
  let branches: string[] = ['HEAD'];
  if (branchesRes.ok) {
    const data = await branchesRes.json() as Array<{ name: string }>;
    branches = data.map(b => b.name).slice(0, 5);
  }

  // Fetch commits for each branch in parallel
  type RawCommit = { sha: string; commit: { message: string; author: { date: string } } };
  const commitsByBranch = await Promise.all(
    branches.map(async (branch) => {
      const res = await fetch(`${base}/commits?sha=${encodeURIComponent(branch)}&per_page=5`, { headers: HEADERS });
      if (!res.ok) return [];
      const data = await res.json() as RawCommit[];
      return data.map(c => ({
        sha: c.sha,
        message: c.commit.message.split('\n')[0].slice(0, 72),
        date: c.commit.author.date.slice(0, 10),
        branch,
      }));
    })
  );

  // Deduplicate by SHA, sort by date descending, take top 5
  const seen = new Set<string>();
  const commits = commitsByBranch
    .flat()
    .filter(c => { if (seen.has(c.sha)) return false; seen.add(c.sha); return true; })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return { readme, languages, commits };
}
