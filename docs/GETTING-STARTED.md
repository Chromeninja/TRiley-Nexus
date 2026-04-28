# Getting Started (No Technical Experience Required)

This guide shows how to copy this portfolio, personalize it, and publish it with GitHub Pages.

## What You Need

- A free GitHub account
- About 15 to 30 minutes
- Your basic profile details (name, email, links, short bio)

## Step 1: Copy This Portfolio

1. Open this repository on GitHub.
2. Click Use this template.
3. Choose Create a new repository.
4. Name your new repository:
   - Use username.github.io if you want your site at your root GitHub Pages URL.
   - Or choose any other name (for example my-portfolio).
5. Click Create repository.

## Step 2: Edit Your Main Settings File

All major content and profile settings live in one file:

- portfolio-config.json (in the root of your repository)

1. Open portfolio-config.json on GitHub.
2. Click the pencil icon to edit.
3. Update these sections:
   - site.name and site.logoText
   - site.repository.owner and site.repository.name
   - social.githubUrl, social.linkedinUrl, social.email
   - footer.tagline and footer.focusLine
   - home, about, skills, howIWork, now, contact text blocks
4. Click Commit changes.

Tip: If you are unsure, keep the structure exactly the same and only replace text values.

## Step 3: Add or Replace Project Entries

Projects are Markdown files in:

- src/content/projects/

You can:

- Edit an existing project file
- Duplicate one file and rename it for a new project
- Remove projects you do not want to show

For the full project field reference, use docs/CONTENT-WIKI.md.

## Step 4: Turn On GitHub Pages

Follow the full step-by-step guide here:

- docs/SETUP-GITHUB-PAGES.md

## Step 5: Confirm It Worked

1. Open the Actions tab in your repo.
2. Wait for the latest deploy workflow to show a green checkmark.
3. Open your live site URL from the workflow summary.

## Common Mistakes

- Repository name in portfolio-config.json does not match your real repository name
- Owner in portfolio-config.json does not match your GitHub username
- Deleting commas or brackets in JSON while editing
- Waiting less than a few minutes after first deployment

## If You Want To Test Changes Before Publishing

Use the local VS Code guide:

- docs/LOCAL-DEVELOPMENT.md
