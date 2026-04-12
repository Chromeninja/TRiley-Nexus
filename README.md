# TRiley-Nexus Portfolio Template

A customizable Astro portfolio template designed for GitHub Pages.

## Who This Is For

- People who want a personal portfolio site with no paid hosting
- Non-technical users who want a guided setup process
- Developers who want to customize locally in VS Code

## Start Here

1. Beginner setup: docs/GETTING-STARTED.md
2. GitHub Pages publish steps: docs/SETUP-GITHUB-PAGES.md
3. Optional local testing in VS Code: docs/LOCAL-DEVELOPMENT.md
4. Project content reference: docs/CONTENT-WIKI.md

## Configuration Model

Most site content is configurable in one file:

- portfolio-config.json

This includes:

- Name, branding text, and social links
- Homepage/about/how-i-work/now/contact content blocks
- Navigation and footer content
- Skills and highlights

Projects are managed as Markdown files in src/content/projects/.

## Deployment

Deployment is automated with GitHub Actions to GitHub Pages.

When you push changes to main, the site rebuilds and republishes automatically.