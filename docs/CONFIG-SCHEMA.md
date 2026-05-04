# Configuration Schema Reference

Complete documentation of every field in `portfolio-config.json`. Use this as a reference when customizing your portfolio.

---

## Top-Level Structure

```json
{
  "site": { ... },
  "navigation": [ ... ],
  "social": { ... },
  "footer": { ... },
  "home": { ... },
  "about": { ... },
  "skills": { ... },
  "howIWork": { ... },
  "now": { ... },
  "contact": { ... },
  "companies": { ... },
  "careerEras": [ ... ],
  "theme": { ... }
}
```

---

## `site` — Site Metadata

Global site configuration used for SEO, branding, and social sharing.

| Field              | Type   | Required | Example                 | Notes                                         |
| ------------------ | ------ | -------- | ----------------------- | --------------------------------------------- |
| `name`             | string | ✓        | `"T.Riley"`             | Your name/brand (appears in title, header)    |
| `logoText`         | string | ✓        | `"T.RILEY"`             | Logo text (usually abbreviated name)          |
| `baseTitle`        | string | ✓        | `"T.Riley"`             | Base page title (used in `<title>` tags)      |
| `description`      | string | ✓        | `"Systems builder..."`  | Short bio (used in meta tags, SEO)            |
| `canonicalUrl`     | string | ✓        | `"https://example.com"` | Your portfolio's primary URL                  |
| `repository.owner` | string | ✓        | `"Chromeninja"`         | GitHub username                               |
| `repository.name`  | string | ✓        | `"TRiley-Nexus"`        | GitHub repo name                              |
| `themeColor`       | string | ✓        | `"#040b19"`             | Color used by browser UI (hex only)           |
| `ogImage`          | string | ✓        | `"/og-image.png"`       | Social sharing image (1200x630px recommended) |

**Example:**

```json
{
  "site": {
    "name": "Alex Jordan",
    "logoText": "AJ",
    "baseTitle": "Alex Jordan",
    "description": "Full-stack engineer building developer tools",
    "canonicalUrl": "https://alexjordan.dev",
    "repository": {
      "owner": "alexjordan",
      "name": "portfolio"
    },
    "themeColor": "#1a1a2e",
    "ogImage": "/og-image.png"
  }
}
```

---

## `navigation` — Top Navigation Menu

Array of links appearing in the main navigation. Set `enabled: false` to hide items without removing them.

| Field     | Type    | Required | Example  | Notes                                       |
| --------- | ------- | -------- | -------- | ------------------------------------------- |
| `href`    | string  | ✓        | `"/"`    | URL path (must start with `/`)              |
| `label`   | string  | ✓        | `"Home"` | Menu text shown to users                    |
| `enabled` | boolean |          | `true`   | Omit or set `true` to show; `false` to hide |

**Example:**

```json
{
  "navigation": [
    { "href": "/", "label": "Home", "enabled": true },
    { "href": "/about", "label": "About", "enabled": true },
    { "href": "/projects", "label": "Projects", "enabled": true },
    { "href": "/blog", "label": "Blog", "enabled": false }
  ]
}
```

---

## `social` — Social & Contact Links

Your social profiles and email contact.

| Field         | Type   | Required | Example                              | Notes                     |
| ------------- | ------ | -------- | ------------------------------------ | ------------------------- |
| `githubUrl`   | string | ✓        | `"https://github.com/yourname"`      | Full GitHub profile URL   |
| `linkedinUrl` | string | ✓        | `"https://linkedin.com/in/yourname"` | Full LinkedIn profile URL |
| `email`       | string | ✓        | `"you@example.com"`                  | Email address             |

**Example:**

```json
{
  "social": {
    "githubUrl": "https://github.com/alexjordan",
    "linkedinUrl": "https://www.linkedin.com/in/alexjordan/",
    "email": "alex@example.com"
  }
}
```

---

## `footer` — Footer Content

Tagline and focus statement appearing in site footer.

| Field       | Type   | Required | Example                               | Notes                                         |
| ----------- | ------ | -------- | ------------------------------------- | --------------------------------------------- |
| `tagline`   | string | ✓        | `"Building tools for developers"`     | Main footer message                           |
| `focusLine` | string | ✓        | `"FOCUS: TOOLS, COMMUNITY, LEARNING"` | Uppercase focus area (e.g., "FOCUS: X, Y, Z") |

**Example:**

```json
{
  "footer": {
    "tagline": "Designer and strategist building human-centered products",
    "focusLine": "FOCUS: DESIGN, STRATEGY, IMPACT"
  }
}
```

---

## `home` — Home Page Content

Hero section, principles, and statistics for the homepage.

### `home.metaDescription`

Meta description for SEO.

- Type: string
- Example: `"Innovative engineer building developer tools"`

### `home.hero`

| Field                   | Type   | Example                  | Notes                             |
| ----------------------- | ------ | ------------------------ | --------------------------------- |
| `eyebrow`               | string | `"// ENGINEERING"`       | Small text above headline         |
| `headlineLead`          | string | `"I build tools that"`   | First part of headline            |
| `headlineAccent`        | string | `"developers love"`      | Emphasized part (usually colored) |
| `headlineTail`          | string | `"to use"`               | Final part of headline            |
| `subtext`               | string | `"Full description..."`  | Larger description                |
| `supportingText`        | string | `"2-3 sentence summary"` | Supporting context                |
| `primaryAction.label`   | string | `"View My Work"`         | Primary button text               |
| `primaryAction.href`    | string | `"/projects"`            | Primary button link               |
| `secondaryAction.label` | string | `"Learn More"`           | Secondary button text             |
| `secondaryAction.href`  | string | `"/about"`               | Secondary button link             |

### `home.principles`

Array of numbered principles/values. Each item has:

- `num`: string (e.g., `"01"`)
- `text`: string (the principle)

### `home.stats`

Array of statistics. Each item has:

- `value`: string (e.g., `"10+"`, `"500K"`)
- `label`: string (e.g., `"Years Experience"`)

**Example:**

```json
{
  "home": {
    "metaDescription": "Engineer building tools developers love",
    "hero": {
      "eyebrow": "// DEVELOPER TOOLS",
      "headlineLead": "I build",
      "headlineAccent": "fast, delightful",
      "headlineTail": "tools for developers",
      "subtext": "Full-stack engineer with 10+ years building developer tools...",
      "supportingText": "I focus on simplicity, performance, and developer experience.",
      "primaryAction": { "label": "View Projects", "href": "/projects" },
      "secondaryAction": { "label": "About Me", "href": "/about" }
    },
    "principles": [
      { "num": "01", "text": "Simplicity first" },
      { "num": "02", "text": "Developer experience matters" }
    ],
    "stats": [
      { "value": "10+", "label": "Years as engineer" },
      { "value": "50+", "label": "Projects shipped" }
    ]
  }
}
```

---

## `about` — About Page

Your background, values, and personal details.

| Field                  | Type     | Example                      | Notes                                |
| ---------------------- | -------- | ---------------------------- | ------------------------------------ |
| `metaDescription`      | string   | `"Who I am and how I work"`  | SEO meta description                 |
| `backgroundParagraphs` | string[] | `["Para 1", "Para 2"]`       | Array of background story paragraphs |
| `thinkItems`           | array    | See below                    | How you think / values               |
| `personalItems`        | array    | See below                    | Personal interests                   |
| `values`               | string[] | `["Honesty", "Integrity"]`   | Core values                          |
| `profileMedia.src`     | string   | `"/media/site/headshot.jpg"` | Your headshot image                  |
| `profileMedia.alt`     | string   | `"Headshot of Jane"`         | Alt text for image                   |
| `resume.title`         | string   | `"Resume"`                   | Label for resume link                |
| `resume.filePath`      | string   | `"/documents/resume.pdf"`    | Path to PDF                          |
| `resume.lastUpdated`   | string   | `"January 2024"`             | When resume was updated              |

### `about.thinkItems`

Array of how-you-think items. Each item:

- `title`: string (short title)
- `text`: string (description)

### `about.personalItems`

Array of personal interests. Each item:

- `icon`: string (Unicode symbol: `"◉"`, `"⬡"`, `"◆"`, `"▣"`, `"⊕"`)
- `title`: string
- `body`: string

**Example:**

```json
{
  "about": {
    "metaDescription": "Engineer, designer, open-source contributor",
    "backgroundParagraphs": ["I started as...", "Then moved into..."],
    "thinkItems": [
      {
        "title": "User-first design",
        "text": "Every feature starts with user needs"
      }
    ],
    "personalItems": [
      {
        "icon": "◉",
        "title": "Open Source",
        "body": "Active contributor to..."
      }
    ],
    "values": ["Honesty", "Learning", "Collaboration"],
    "profileMedia": {
      "src": "/media/site/headshot.jpg",
      "alt": "Headshot of me"
    },
    "resume": {
      "title": "Resume",
      "filePath": "/documents/resume.pdf",
      "lastUpdated": "January 2024"
    }
  }
}
```

---

## `skills` — Skills Section

Professional skills grouped by category.

### `skills.groups`

Array of skill groups. Each item:

- `label`: string (group name: `"Backend"`, `"DevOps"`, etc.)
- `icon`: string (Unicode symbol)
- `skills`: string[] (list of skills)

### `skills.coreStrengths`

Array of core strengths. Each item:

- `icon`: string (Unicode symbol)
- `title`: string
- `description`: string

**Example:**

```json
{
  "skills": {
    "groups": [
      {
        "label": "Backend",
        "icon": "◈",
        "skills": ["Node.js", "Python", "Go", "Docker"]
      },
      {
        "label": "Frontend",
        "icon": "▣",
        "skills": ["React", "TypeScript", "Tailwind", "Next.js"]
      }
    ],
    "coreStrengths": [
      {
        "icon": "◉",
        "title": "Problem Solving",
        "description": "I break down complex problems..."
      }
    ]
  }
}
```

---

## `howIWork` — How I Work Page

Your methodology, work principles, and tools.

| Field                    | Type     | Example                                |
| ------------------------ | -------- | -------------------------------------- |
| `metaDescription`        | string   | SEO description                        |
| `coreApproachParagraphs` | string[] | Your core approach (2-3 paragraphs)    |
| `workPrinciples`         | array    | Numbered principles (01, 02, 03, etc.) |
| `workStyleGroups`        | array    | Work style categories                  |
| `toolchainGroups`        | array    | Tools organized by category            |
| `aar.intro`              | string   | After Action Review intro              |
| `aar.questions`          | array    | AAR questions                          |

**Example:**

```json
{
  "howIWork": {
    "metaDescription": "My methodology and approach",
    "coreApproachParagraphs": ["I believe in..."],
    "workPrinciples": [
      {
        "num": "01",
        "title": "User research first",
        "body": "Every project starts with understanding users"
      }
    ],
    "workStyleGroups": [
      {
        "icon": "◈",
        "title": "How I communicate",
        "items": ["Direct and clear", "Written documentation"]
      }
    ],
    "toolchainGroups": [
      {
        "category": "Frontend",
        "tools": ["React", "TypeScript", "Tailwind"]
      }
    ],
    "aar": {
      "intro": "After every project...",
      "questions": [
        {
          "q": "What worked?",
          "sub": "Successes to replicate"
        }
      ]
    }
  }
}
```

---

## `now` — Now Page

What you're currently focused on.

| Field              | Type     | Example                     | Notes                      |
| ------------------ | -------- | --------------------------- | -------------------------- |
| `metaDescription`  | string   | `"What I'm working on now"` | SEO description            |
| `lastUpdated`      | string   | `"January 2024"`            | When this was last updated |
| `statusHeadline`   | string   | `"CURRENT STATUS"`          | Headline label             |
| `statusValue`      | string   | `"OPEN FOR WORK"`           | Your current status        |
| `statusSupport`    | string   | `"Taking on new projects"`  | Status detail              |
| `explorationItems` | array    | See below                   | What you're exploring      |
| `priorityItems`    | array    | See below                   | Current priorities         |
| `openTo.yes`       | string[] | Types of work you want      |                            |
| `openTo.no`        | string[] | Types of work you avoid     |                            |

### `explorationItems`

Array with `icon`, `title`, `body`

### `priorityItems`

Array with `label` (`"HIGH"`, `"MED"`, `"LOW"`), `text`, `color` (`"badge-green"`, `"badge-yellow"`, `"badge-gray"`)

**Example:**

```json
{
  "now": {
    "metaDescription": "What I'm working on now",
    "lastUpdated": "January 2024",
    "statusHeadline": "CURRENT FOCUS",
    "statusValue": "OPEN FOR CONTRACTS",
    "statusSupport": "Product design and UX research",
    "explorationItems": [
      {
        "icon": "◉",
        "title": "AI UX",
        "body": "How to design for AI interfaces"
      }
    ],
    "priorityItems": [
      {
        "label": "HIGH",
        "text": "Finish current project",
        "color": "badge-green"
      }
    ],
    "openTo": {
      "yes": ["Product design roles", "UX research"],
      "no": ["Freelance gigs"]
    }
  }
}
```

---

## `contact` — Contact Page

How to get in touch.

| Field             | Type   | Example                  |
| ----------------- | ------ | ------------------------ |
| `metaDescription` | string | SEO description          |
| `heroSubtitle`    | string | Main subtitle on page    |
| `emailHint`       | string | What to use email for    |
| `linkedinHint`    | string | What to use LinkedIn for |
| `githubHint`      | string | What to use GitHub for   |
| `responseTime`    | string | Expected response time   |
| `bestFor`         | string | Best use cases           |
| `notAFit`         | string | Things you don't want    |
| `status`          | string | Your availability        |
| `statusNote`      | string | Additional status info   |

**Example:**

```json
{
  "contact": {
    "metaDescription": "Get in touch",
    "heroSubtitle": "Open to conversations",
    "emailHint": "Best for professional work",
    "linkedinHint": "Professional connections",
    "githubHint": "Code samples",
    "responseTime": "I respond within 2 business days",
    "bestFor": "Genuine opportunities",
    "notAFit": "Spam, generic outreach",
    "status": "Open to opportunities",
    "statusNote": "Interested in product roles"
  }
}
```

---

## `companies` — Organizations & Companies

All companies/organizations you've worked with. Referenced by projects.

```json
{
  "companies": {
    "Company Name": {
      "summary": "What the company does / role",
      "companyInfo": "Company background",
      "myTimeInfo": "What you did there",
      "longSummary": "Longer description (optional)",
      "roleSummary": "Your role progression",
      "achievements": ["Achievement 1", "Achievement 2"],
      "color": "#57a6ff",
      "tenureStart": "2020",
      "tenureEnd": "Present",
      "logo": {
        "src": "/media/companies/logo.png",
        "alt": "Company logo"
      },
      "timelineRoles": [
        {
          "label": "Role Title",
          "start": "2020",
          "end": "2021"
        }
      ]
    }
  }
}
```

**Field reference:**

| Field           | Type     | Required | Notes                                    |
| --------------- | -------- | -------- | ---------------------------------------- |
| `summary`       | string   | ✓        | One-liner about company/role             |
| `companyInfo`   | string   | ✓        | What the company does                    |
| `myTimeInfo`    | string   | ✓        | Your tenure and role                     |
| `longSummary`   | string   |          | Longer description                       |
| `roleSummary`   | string   |          | Role progression (e.g., "IC to Manager") |
| `achievements`  | string[] |          | Key wins (2-4 items)                     |
| `color`         | string   |          | Hex color for timeline (#RRGGBB)         |
| `tenureStart`   | string   | ✓        | Start year or `"Jan 2020"`               |
| `tenureEnd`     | string   | ✓        | End year, `"Present"`, or `"Feb 2021"`   |
| `logo.src`      | string   |          | Path to logo image                       |
| `logo.alt`      | string   |          | Alt text for logo                        |
| `timelineRoles` | array    |          | Array of `{ label, start, end }`         |

---

## `careerEras` — Career Timeline Periods

Periods in your career (appears on `/career` page).

```json
{
  "careerEras": [
    {
      "label": "Early Career",
      "start": "2010",
      "end": "2014",
      "theme": "Foundation building"
    }
  ]
}
```

**Field reference:**

| Field   | Type   | Required | Example                 | Notes                 |
| ------- | ------ | -------- | ----------------------- | --------------------- |
| `label` | string | ✓        | `"Leadership Growth"`   | Era name              |
| `start` | string | ✓        | `"2015"`                | Start year            |
| `end`   | string | ✓        | `"2019"` or `"Present"` | End year              |
| `theme` | string | ✓        | `"Program leadership"`  | What defined this era |

---

## `theme` — Styling & Customization

Colors and fonts for the entire site.

### `theme.colors`

All customizable colors. Hex format only (#RRGGBB).

| Key           | Purpose                      | Example     |
| ------------- | ---------------------------- | ----------- |
| `primary`     | Main accent (links, buttons) | `"#57a6ff"` |
| `secondary`   | Secondary accent             | `"#22d3ee"` |
| `accent`      | Tertiary accent              | `"#fbbf24"` |
| `success`     | Success state                | `"#4ade80"` |
| `warning`     | Warning state                | `"#fbbf24"` |
| `danger`      | Error state                  | `"#ef4444"` |
| `bgPrimary`   | Main background              | `"#040b19"` |
| `bgSecondary` | Secondary background         | `"#091327"` |
| `bgCard`      | Card background              | `"#0c1830"` |
| `bgCardHover` | Card hover state             | `"#12203b"` |
| `textPrimary` | Main text                    | `"#d9e7ff"` |
| `textMuted`   | Muted text                   | `"#91a4c7"` |
| `textDim`     | Dimmed text                  | `"#5d7398"` |
| `textHeading` | Heading text                 | `"#f4f8ff"` |

### `theme.fonts`

Font family names. Include fallbacks.

| Key       | Purpose          | Example                                      |
| --------- | ---------------- | -------------------------------------------- |
| `heading` | Headings (h1-h6) | `"'Sora', 'Space Grotesk', sans-serif"`      |
| `body`    | Body text        | `"'Manrope', system-ui, sans-serif"`         |
| `mono`    | Code/monospace   | `"'JetBrains Mono', 'Fira Code', monospace"` |

**Example:**

```json
{
  "theme": {
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#06b6d4",
      "accent": "#f59e0b",
      "success": "#10b981",
      "warning": "#f59e0b",
      "danger": "#ef4444",
      "bgPrimary": "#0f172a",
      "bgSecondary": "#1e293b",
      "bgCard": "#1f2937",
      "bgCardHover": "#374151",
      "textPrimary": "#f1f5f9",
      "textMuted": "#cbd5e1",
      "textDim": "#94a3b8",
      "textHeading": "#f8fafc"
    },
    "fonts": {
      "heading": "'Inter', sans-serif",
      "body": "'Poppins', sans-serif",
      "mono": "'Roboto Mono', monospace"
    }
  }
}
```

---

## JSON Tips

- **Comments**: JSON doesn't support comments. Use descriptive field names instead.
- **Quotes**: Always use straight double quotes `"`, not curly quotes `""`
- **Trailing commas**: Not allowed in JSON. Remove commas after last item in arrays/objects.
- **Line breaks**: Use `\n` for newlines in strings
- **URLs**: Use full URLs with `https://` for all links

---

## See Also

- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — How-to guide for common tasks
- [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) — Running locally during development
- Main repository: [TRiley-Nexus](https://github.com/Chromeninja/TRiley-Nexus)
