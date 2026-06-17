---
name: run-triley-nexus
description: Build, run, and drive the TRiley-Nexus Astro portfolio site. Use when asked to start the site, take a screenshot of any page, smoke-test all routes, build for production, or verify a UI change.
---

Astro 6 static portfolio site. An agent drives it by starting the dev server then running the Playwright driver at `.claude/skills/run-triley-nexus/driver.mjs`. All paths are relative to the repo root (`/home/chrome/TRiley-Nexus/`).

## Prerequisites

Node ≥ 22.12.0 is required (Astro 6 refuses to start on Node 20). Install via Volta — no sudo needed:

```bash
curl -fsSL https://get.volta.sh | bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
volta install node@22
```

Add the two `export` lines to `~/.bashrc` so they persist. Verify:

```bash
node --version   # must be ≥ 22.12.0
```

The global Playwright package at `/home/chrome/.local/npm/lib/node_modules/playwright` provides Chromium. No project-level install required.

## Setup

```bash
cd /home/chrome/TRiley-Nexus
npm ci
```

## Run (agent path)

### 1. Start the dev server

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
kill $(cat /tmp/astro.pid 2>/dev/null) 2>/dev/null; sleep 1
node ./node_modules/.bin/astro dev --port 4321 > /tmp/astro-dev.log 2>&1 &
echo $! > /tmp/astro.pid
timeout 30 bash -c 'until curl -sf http://localhost:4321 >/dev/null 2>&1; do sleep 1; done'
echo "Dev server ready"
```

### 2. Run the driver

Screenshot every page (exit 0 = all 200, exit 1 = any failure):

```bash
node .claude/skills/run-triley-nexus/driver.mjs
```

Screenshot one page only:

```bash
node .claude/skills/run-triley-nexus/driver.mjs --screenshot projects
```

Valid slugs: `home`, `about`, `projects`, `career`, `how-i-work`, `now`, `contact`.

Screenshots land at `/tmp/shots/triley-nexus/<slug>.png`.

### 3. Stop the server

```bash
kill $(cat /tmp/astro.pid 2>/dev/null) 2>/dev/null
```

## Run (human path)

```bash
export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH"
npm run dev   # → browser at http://localhost:4321. Ctrl-C to stop.
```

## Build

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
npm run build   # output in dist/
```

## Type check / lint

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
npm run check          # astro check + tsc --noEmit
npm run lint           # ESLint
npm run format:check   # Prettier
```

There is no test suite — `npm run check` is the correctness gate.

## Gotchas

- **Node 20 looks like it works but silently exits** — `astro dev` prints `Node.js v20 is not supported` and quits with code 144. The process starts but dies immediately. Use Volta to get Node 22.
- **`chromium-cli` is not installed** — use the Playwright driver at `.claude/skills/run-triley-nexus/driver.mjs` instead.
- **Playwright import path is absolute** — the driver imports from `/home/chrome/.local/npm/lib/node_modules/playwright/index.mjs` (global install). If that path disappears, reinstall with `npm install -g playwright` and run `playwright install chromium`.
- **`npx astro dev` exits code 144** — `npx` forks a child; when the npx parent exits (code 144 = SIGURG artifact), the child server dies with it. Use `node ./node_modules/.bin/astro dev` directly — this process IS the server, not a wrapper.
- **Port 4321 already in use** — stop via PID file: `kill $(cat /tmp/astro.pid 2>/dev/null) 2>/dev/null; sleep 1`. Never use `pkill -f astro` — the VS Code Astro extension processes match that pattern and killing them destabilizes the shell (exit code 144).

## Troubleshooting

- **`Node.js vX is not supported by Astro!`**: System Node is < 22. Run `volta install node@22` and re-export PATH as above.
- **`timeout` waiting for port 4321**: Server failed to start. Check `/tmp/astro-dev.log` for the actual error.
- **Playwright `Cannot find package`**: The absolute import path changed. Confirm `ls /home/chrome/.local/npm/lib/node_modules/playwright` exists; if not, `npm install -g playwright && playwright install chromium`.
- **Screenshots are blank/white**: Server started but the route 404s or threw at render time. Check `/tmp/astro-dev.log` and the driver's console-error output.
