# Content Wiki

This guide explains where to edit your content.

If you are new, start with docs/GETTING-STARTED.md first.

## Content Layout (Simple Version)

There are two main places you will edit:

1. portfolio-config.json
2. src/content/projects/ (project Markdown files)

## 1) Main Site Content: portfolio-config.json

Use this one file to edit most personal/site content:

- Name and branding
- Navigation labels
- Footer text
- Social links and email
- Home page text
- About page text
- Skills and strengths
- How I Work page content
- Now page content
- Contact page text

Tip: Keep the JSON structure exactly the same. Replace only the text values.

## 2) Projects: src/content/projects/

Each project is one Markdown file.

You can:

- Edit existing project files
- Duplicate a project file to create a new one
- Delete project files you do not want

## Required Project Frontmatter Fields

Each project file should include:

- title
- status: active | completed | archived | concept
- category
- tags (array)
- summary
- featured (boolean)

## Optional Project Fields

- organization
- timeframe
- problem
- approach
- outcome
- skills (array)
- tools (array)
- order (number)
- links (array)
- media (array)

## Link Example

```yaml
links:
  - label: Website
    url: https://example.com
  - label: GitHub
    url: https://github.com/yourname/your-repo
```

## Media Example (Image)

```yaml
media:
  - type: image
    src: /images/projects/my-project/hero.jpg
    alt: Screenshot of my project
    caption: Optional caption
```

## Media Example (Video)

```yaml
media:
  - type: video
    src: /media/projects/my-project/demo.mp4
    poster: /images/projects/my-project/poster.jpg
    caption: Optional caption
```

## Where To Get Help

- Full setup: docs/GETTING-STARTED.md
- GitHub Pages publishing: docs/SETUP-GITHUB-PAGES.md
- Local testing in VS Code: docs/LOCAL-DEVELOPMENT.md
