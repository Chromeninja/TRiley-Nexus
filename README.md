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

You can also use the local content editor for guided updates:

- Run `npm run content-editor`
- Open `http://127.0.0.1:4387`
- Edit markdown content files, preview changes, then save
- Upload media files for projects, company logos, and site assets

This includes:

- Name, branding text, and social links
- Homepage/about/how-i-work/now/contact content blocks
- Navigation and footer content
- Skills and highlights

Projects are managed as Markdown files in src/content/projects/.

## Deployment

Deployment is automated with GitHub Actions to GitHub Pages.

When you push changes to main, the site rebuilds and republishes automatically.

---

## For Forkers: Customize Your Portfolio

This template is designed to be forked and customized **without writing code**. Here's how:

### Quick Start (5 minutes)

1. **Fork this repository** on GitHub
2. **Clone your fork** locally
3. **Edit your markdown content files** in `src/content/`
   - Or run `npm run content-editor` and use the local UI
4. **Edit these fields**:
   - `site.name` → Your name
   - `site.description` → Your tagline
   - `social.email` → Your email
   - `theme.colors.primary` → Your brand color
5. **Rebuild**: `npm run build`
6. **Deploy**: Push to `main` → GitHub Actions redeploys automatically

### What's Customizable

| Item                 | How                                        | Time               |
| -------------------- | ------------------------------------------ | ------------------ |
| **Project content**  | Edit `.md` files in `src/content/projects` | 10 min per project |
| **Colors & fonts**   | Edit `theme` section in JSON               | 5 min              |
| **About content**    | Edit `src/content/about/about.md`          | 10 min             |
| **Companies/orgs**   | Edit `src/content/companies/companies.md`  | 10 min             |
| **Navigation links** | Edit `navigation` array in JSON            | 2 min              |
| **Career timeline**  | Edit `careerEras` array in JSON            | 5 min              |

### Full Customization Guide

👉 **Read [docs/CUSTOMIZATION.md](./docs/CUSTOMIZATION.md)** for detailed how-tos:

- How to add projects
- How to add companies
- How to customize colors
- How to change fonts
- Asset organization

### Configuration Reference

👉 **See [docs/CONFIG-SCHEMA.md](./docs/CONFIG-SCHEMA.md)** for complete field documentation of every option in `portfolio-config.json`.

### Example: Change Your Brand Color

1. Open `portfolio-config.json`
2. Find this line: `"primary": "#57a6ff"`
3. Replace with your hex color: `"primary": "#3b82f6"`
4. Run `npm run build`
5. Your brand color updates everywhere (buttons, links, accents)

### No Code Experience Needed

- All customization is in `portfolio-config.json` (JSON is just formatted text)
- Follow the examples in `CUSTOMIZATION.md`
- If stuck, check `CONFIG-SCHEMA.md` for field definitions
- The `portfolio-config.json` file has inline comments starting with `"_comment_"` to guide you

---
