# Local Development in VS Code (Optional)

This page is only for people who want to test changes locally before pushing to GitHub.

## What You Need

- VS Code
- Node.js 22.12+
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
- Content Editor: Start

Use them from the VS Code command palette or task runner.

## Launch the Local Content Editor

This helper lets you edit markdown content files and upload media assets with a preview-before-save flow.

1. Run task `Content Editor: Start` in VS Code, or run:

```bash
npm run content-editor
```

2. Open `http://127.0.0.1:4387`
3. Select a markdown file from `src/content/`
4. Validate, preview, then save
5. Use Upload Media to add files under `public/media/*` or `public/documents`

Behavior:

- Only markdown files under `src/content/` are editable
- All saves create a backup in `.content-editor-backups/`

## Common Local Issues

- Node version too old: install Node.js 22.12+
- Dependencies missing: run npm install again
- Port already used: close old local server and restart
