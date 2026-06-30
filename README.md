# portfolio-cli

Personal portfolio navigable via SSH — built with Node.js, TypeScript, and Ink (React for terminal).

```bash
ssh hi.juanmontreuil.dev
```

## Stack

- **UI** — [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **SSH server** — [ssh2](https://github.com/mscdex/ssh2)
- **AI summaries** — Gemini 2.5 Pro via GitHub API
- **Deploy** — Fly.io

## Run locally

```bash
npm install
npm run local
```

Requires a `GOOGLE_API_KEY` in `.env.local` for AI project summaries.

## Architecture

```
core/       # Data layer (schema, loader, search) — reusable by future MCP server
ui/         # Ink components (views, nav, theme)
ssh/        # Thin SSH shell — renders the Ink app to each session stream
assets/     # ASCII logo
```

## License

MIT
