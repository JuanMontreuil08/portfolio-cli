# portfolio-cli

Personal portfolio navigable via SSH — built with Node.js, TypeScript, and Ink (React for terminal).

```bash
ssh -p 2222 92.5.185.78
```

## Stack

- **UI** — [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **SSH server** — [ssh2](https://github.com/mscdex/ssh2)
- **AI summaries** — Gemini via Google AI API
- **Deploy** — Oracle Cloud (VM + VCN)
- **Process manager** — PM2

## Run locally

```bash
npm install
npm run local        # run UI directly in terminal
npm run dev          # run SSH server on port 2222
```

Requires a `GOOGLE_API_KEY` in `.env.local` for AI project summaries.

## Deploy (Oracle Cloud)

**VM:** Ubuntu 22.04, shape VM.Standard.A1.Flex (free tier)
**Public IP:** 92.5.185.78
**Port:** 2222

**Oracle services used:**
- Compute Instance — runs the Node.js SSH server
- Virtual Cloud Network (VCN) — private network for the VM
- Security List — ingress rules (port 22 for admin SSH, port 2222 for portfolio)

**On the server:**
```bash
cd /home/ubuntu/portfolio-cli
git pull
npm run build
pm2 restart portfolio
```

**PM2 setup (first time):**
```bash
pm2 start "node dist/ssh/server.js" --name portfolio
pm2 startup    # run the command it outputs
pm2 save
```

**Pending:**
- DNS — add an A record pointing `hi.juanmontreuil.com` to `92.5.185.78`
- Once DNS is set: `ssh -p 2222 hi.juanmontreuil.com`
- Optional: iptables redirect port 22 → 2222 to drop the `-p 2222`

## Architecture

```
core/       # Data layer (schema, loader, search) — reusable by future MCP server
ui/         # Ink components (views, nav, theme)
ssh/        # Thin SSH shell — renders the Ink app to each session stream
assets/     # ASCII logo
```

## License

MIT
