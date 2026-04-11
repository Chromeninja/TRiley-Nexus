# TRiley-Nexus

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Astro starts at `http://localhost:4321` by default.

## VS Code Run/Debug Setup

This repo includes workspace-level VS Code config in `.vscode/` for local development and testing:

- `launch.json`
	- `Astro: Start Local Dev Server`: starts Astro locally on `http://localhost:4321`.
- `tasks.json`
	- `Astro: Dev Server`
	- `Astro: Build`
	- `Astro: Preview`

### Use The Debugger

1. Open the Run and Debug view in VS Code.
2. Select `Astro: Start Local Dev Server`.
3. Press F5.

VS Code will start the dev server. Open `http://localhost:4321` manually in your browser.