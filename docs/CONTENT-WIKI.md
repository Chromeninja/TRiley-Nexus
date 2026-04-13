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

## Media Storage Convention

Store all uploaded images and videos under `public/media/`.

- Project assets: `/media/projects/`
- Company logos: `/media/companies/`
- Site/profile images and placeholders: `/media/site/`

Use flat, descriptive filenames instead of nested per-item folders.

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
- organizationUrl
- timeframe
- problem
- approach
- outcome
- skills (array)
- tools (array)
- cover (object)
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

## Organization Link Example

Use `organizationUrl` when you want the company name to link anywhere the organization name is shown.

```yaml
organization: Happy Manic
organizationUrl: https://happymanic.com/
```

## Cover Example (Project Card Only)

Use `cover` for the image shown on the projects grid card.

This image does not appear in the project detail gallery.

```yaml
cover:
  src: /media/projects/my-project-cover.webp
  alt: My Project logo or cover image
```

## Media Example (Image On Project Page)

Use `media` images for screenshots, product shots, or photos of real-world work on the detail page.

```yaml
media:
  - type: image
    src: /media/projects/my-project-screenshot-01.webp
    alt: Screenshot of my project
    caption: Optional caption
```

## Media Example (Video)

```yaml
media:
  - type: video
    src: /media/projects/my-project-trailer.mp4
    caption: Optional caption
```

## File Naming Best Practices

- Store all project assets in `/media/projects/`
- Cover image for project cards: `/media/projects/my-project-cover.webp`
- Project screenshots: `/media/projects/my-project-screenshot-01.webp`
- Product images: `/media/projects/my-project-product-01.webp`
- Real-world or on-site photos: `/media/projects/my-project-photo-01.webp`
- Trailer or demo video: `/media/projects/my-project-trailer.mp4` or `/media/projects/my-project-demo.mp4`
- Use the project slug as the filename prefix so each project's assets stay grouped without subfolders

## Other Image Examples

Use `portfolio-config.json` for About page profile images.

```json
"profileMedia": {
  "src": "/media/site/headshot.JPG",
  "alt": "Professional headshot",
  "caption": "Optional caption"
}
```

Use `src/data/companyProfiles.ts` for company logos shown in the career atlas.

```ts
logo: {
  src: "/media/companies/your-company-logo.png",
  alt: "Your Company logo",
},
```

- Company logo pattern: `/media/companies/your-company-logo.png`
- Profile image pattern: `/media/site/headshot.JPG`
- Placeholder/supporting site image pattern: `/media/site/profile-headshot-placeholder.svg`
- Do not add new assets under `public/images/`; use `public/media/` only

## Format Guidance

- Prefer `.webp` for cover images, screenshots, product images, and photos
- Prefer `.mp4` for project videos
- Use `cover` when you want a static card image and keep the detail page media separate
- Use `media` when you want the asset to appear on the project detail page

## Where To Get Help

- Full setup: docs/GETTING-STARTED.md
- GitHub Pages publishing: docs/SETUP-GITHUB-PAGES.md
- Local testing in VS Code: docs/LOCAL-DEVELOPMENT.md
