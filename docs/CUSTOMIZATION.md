# Customization Guide for TRiley-Nexus

Welcome! This portfolio is designed to be forked and customized without touching code. Everything you need to personalize it lives in **`portfolio-config.json`**.

---

## Quick Start (5 Minutes)

1. **Fork this repository** on GitHub
2. **Clone your fork** locally
3. **Open `portfolio-config.json`** in your editor
4. Edit these sections (in order):
   - `site.name` → Your name
   - `site.description` → Your tagline
   - `social.email` → Your email
   - `social.githubUrl` → Your GitHub
   - `social.linkedinUrl` → Your LinkedIn
5. **Run `npm run build`** to test locally
6. **Deploy to GitHub Pages** (see [SETUP-GITHUB-PAGES.md](./SETUP-GITHUB-PAGES.md))

Done! Your portfolio is live with your information.

---

## What's Customizable

| What                                            | Difficulty | How                                          | Notes                                     |
| ----------------------------------------------- | ---------- | -------------------------------------------- | ----------------------------------------- |
| **Site name, description, branding**            | ✅ Easy    | Edit `site.*` in JSON                        | 15 seconds                                |
| **Navigation links**                            | ✅ Easy    | Edit `navigation.*` in JSON                  | Enable/disable with `enabled: true/false` |
| **Social links (email, GitHub, LinkedIn)**      | ✅ Easy    | Edit `social.*` in JSON                      | 1 minute                                  |
| **All page content (About, Now, Contact, etc)** | ✅ Easy    | Edit page sections in JSON                   | Supports plain text and markdown          |
| **Home page hero, principles, stats**           | ✅ Easy    | Edit `home.*` in JSON                        | 5 minutes                                 |
| **Colors and fonts**                            | ✅ Easy    | Edit `theme.*` in JSON                       | See [Styling](#styling) section           |
| **Add new project**                             | ⚠️ Medium  | Create `.md` file in `src/content/projects/` | See [Adding Projects](#adding-projects)   |
| **Add new company**                             | ⚠️ Medium  | Add to `companies` section in JSON           | See [Adding Companies](#adding-companies) |
| **Customize timeline eras**                     | ⚠️ Medium  | Edit `careerEras` in JSON                    | See [Career Timeline](#career-timeline)   |
| **Component layout, page structure**            | ❌ Hard    | Requires code changes                        | Beyond this guide                         |

---

## Common Tasks

### Styling

**Change primary color:**

1. Open `portfolio-config.json`
2. Find `theme.colors.primary`
3. Change the hex value: `"primary": "#YOUR_COLOR_HERE"`
4. Run `npm run build`
5. Colors update everywhere (buttons, links, highlights)

**Change fonts:**

1. Find `theme.fonts` section
2. Edit the font family names:
   ```json
   "fonts": {
     "heading": "'Your Font', sans-serif",
     "body": "'Your Font', sans-serif",
     "mono": "'Your Font', monospace"
   }
   ```
3. Run `npm run build`

**Available colors to customize:**

- `primary` — Main accent color (links, buttons, borders)
- `secondary` — Alternate accent (secondary elements)
- `accent` — Highlight color (warnings, important items)
- `success` — Success state (green)
- `warning` — Warning state (yellow)
- `danger` — Error state (red)
- `bgPrimary`, `bgSecondary`, `bgCard` — Background colors
- `textPrimary`, `textMuted`, `textDim`, `textHeading` — Text colors

### Adding Projects

1. Create a new file: `src/content/projects/my-project-name.md`
2. Use this template:

```markdown
---
title: "Your Project Title"
status: "active"
category: "category-name"
tags: ["tag1", "tag2", "tag3"]
organization: "Company Name"
organizationUrl: "https://company.com"
summary: "One-sentence summary of what you did"
cardSummary: "Brief 2-3 line description for project cards"
highlights:
  - "Major achievement 1"
  - "Major achievement 2"
  - "Major achievement 3"
problem: "What was the challenge?"
approach: "How did you approach it?"
outcome: "What was the result?"
skills: ["skill1", "skill2", "skill3"]
tools: ["tool1", "tool2"]
featured: true
order: 1
cover:
  src: "/media/projects/your-project-cover.jpg"
  alt: "Description of cover image"
links:
  - label: "View on GitHub"
    url: "https://github.com/..."
  - label: "Read Blog Post"
    url: "https://blog.com/..."
media:
  - type: "image"
    src: "/media/projects/screenshot1.jpg"
    alt: "Screenshot 1"
    caption: "What this shows"
  - type: "video"
    src: "https://youtube.com/embed/..."
    poster: "/media/projects/video-poster.jpg"
    alt: "Video description"
    caption: "Demo video"
---

## Project Details

Longer description of your project here. You can use **markdown** formatting:

- Bullet points
- _Italic_ and **bold** text
- [Links](https://example.com)
- Code snippets

### Challenge

What was the main problem you were solving?

### Solution

How did you solve it? What was your approach?

### Results

What were the measurable outcomes?
```

**Project field reference:**

- `title` (required) — Project name
- `status` — "active", "completed", "archived", or "concept"
- `category` — Group projects by category (e.g., "Engineering", "Operations", "Community")
- `tags` — List of tags for filtering
- `organization` — Company/org name (use exact name from `companies` section)
- `summary` (required) — One sentence for timeline/list view
- `highlights` — 3 key points (shown on project card)
- `featured` — Set `true` to pin to top of projects page
- `order` — Numeric order for sorting (lower = appears first)
- `skills` & `tools` — Skills and tools you used
- `media` — Images and videos (use paths relative to `/public/`)

### Adding Companies

1. Open `portfolio-config.json`
2. Find the `companies` section
3. Add a new company:

```json
"Company Name": {
  "summary": "Short one-liner about the company or your role",
  "companyInfo": "What does this company/org do?",
  "myTimeInfo": "What did you do there during your tenure?",
  "longSummary": "More detailed description of your impact",
  "roleSummary": "Your role trajectory (e.g., 'Support ops to senior PM')",
  "achievements": [
    "Major achievement 1",
    "Major achievement 2"
  ],
  "color": "#57a6ff",
  "tenureStart": "2020",
  "tenureEnd": "Present",
  "logo": {
    "src": "/media/companies/company-logo.png",
    "alt": "Company Name logo"
  },
  "timelineRoles": [
    {
      "label": "Role Title 1",
      "start": "2020",
      "end": "2021"
    },
    {
      "label": "Role Title 2",
      "start": "2022",
      "end": "Present"
    }
  ]
}
```

Then reference this company in your projects using the exact `organization` name.

### Career Timeline

Customize your career eras (the periods that appear on `/career` page):

1. Open `portfolio-config.json`
2. Find `careerEras` array
3. Edit existing eras or add new ones:

```json
{
  "label": "Era Name",
  "start": "2020",
  "end": "2023",
  "theme": "What defined this period?"
}
```

The `theme` is a short phrase describing that career phase.

---

## Asset Organization

All images, videos, and documents go in `/public/media/`:

```
/public/media/
├── companies/
│   ├── company1-logo.png
│   └── company2-logo.png
├── projects/
│   ├── project1-cover.jpg
│   ├── project1-screenshot1.jpg
│   └── project2-demo.mp4
└── site/
    ├── headshot.jpg
    ├── og-image.png
    └── favicon.ico
```

Reference paths in JSON/markdown as: `/media/category/filename.ext`

---

## File Structure

```
portfolio-config.json          ← Your main customization file (READ THE COMMENTS!)
src/
├── content/
│   └── projects/             ← Add your project .md files here
├── data/
│   ├── siteConfig.ts         ← Loads portfolio-config.json (don't edit)
│   ├── companyProfiles.ts    ← Loads companies from JSON (don't edit)
│   └── careerAtlas.ts        ← Loads career eras from JSON (don't edit)
├── styles/
│   └── global.css            ← Contains CSS variables synced with theme JSON
└── components/               ← Reusable page components (don't edit)

/public/media/                ← Your images, videos, documents
docs/
├── CUSTOMIZATION.md          ← This file!
├── CONFIG-SCHEMA.md          ← Full field reference
└── LOCAL-DEVELOPMENT.md      ← How to run locally
```

---

## Field Reference

See [CONFIG-SCHEMA.md](./CONFIG-SCHEMA.md) for exhaustive documentation of every field in `portfolio-config.json`.

---

## Troubleshooting

**Build fails after editing JSON:**

- Check JSON syntax (use a JSON validator: https://jsonlint.com/)
- Make sure all quote marks match (`"` not smart quotes)
- Verify no trailing commas in arrays/objects

**Colors don't change:**

- Edit `portfolio-config.json` (not CSS files)
- Rebuild: `npm run build`
- Clear browser cache: `Cmd/Ctrl + Shift + Delete`

**Project doesn't appear:**

- Make sure project file is in `src/content/projects/`
- Filename should be kebab-case: `my-project-name.md`
- Check frontmatter is valid YAML between `---` markers

**Company name not recognized:**

- Use exact name from `companies` section in `portfolio-config.json`
- Names are case-sensitive

---

## For Forkers: Next Steps

1. **Customize portfolio-config.json** (15-30 min)
2. **Test locally:** `npm run dev` → http://localhost:4321
3. **Add your projects** (put markdown files in `src/content/projects/`)
4. **Deploy to GitHub Pages** (see [SETUP-GITHUB-PAGES.md](./SETUP-GITHUB-PAGES.md))
5. **Update README.md** with your own intro

---

## Questions or Issues?

If something is broken or unclear:

1. Check [CONFIG-SCHEMA.md](./CONFIG-SCHEMA.md) for field documentation
2. Review the example values in `portfolio-config.json`
3. Open an issue on GitHub with details about what went wrong

Happy customizing! 🚀
