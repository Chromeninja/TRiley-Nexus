# Local Development in VS Code (Optional)

This page is only for people who want to test changes locally before pushing to GitHub.

## What You Need

- VS Code
- Node.js 20+
- npm 10+

## Setup Once

1. Open this repository folder in VS Code.
2. Open Terminal in VS Code.
3. Run:

```bash
npm install
```

## Start a Local Preview

You can use VS Code tasks instead of remembering commands:

1. Open Run and Debug.
2. Choose Astro: Start Local Dev Server.
3. Start it.
4. Open http://localhost:4321 in your browser.

You can also run from terminal:

```bash
npm run dev
```

## Build Test (Recommended Before Pushing)

Run:

```bash
npm run build
```

If build succeeds, your GitHub Pages deployment is more likely to succeed too.

## Helpful VS Code Tasks

This repo includes:

- Astro: Dev Server
- Astro: Build
- Astro: Preview

Use them from the VS Code command palette or task runner.

## Common Local Issues

- Node version too old: install Node.js 20+
- Dependencies missing: run npm install again
- Port already used: close old local server and restart
