# GitHub Pages Setup Guide

This guide is for first-time users. It explains exactly how to publish your portfolio from GitHub.

## Before You Start

Make sure you already:

- Created your own copy of this repository
- Updated portfolio-config.json with your information

## Step-by-Step

1. Open your repository on GitHub.
2. Click Settings.
3. In the left menu, click Pages.
4. Under Build and deployment, set Source to GitHub Actions.
5. Go to the Actions tab.
6. Confirm a workflow named Deploy to GitHub Pages is running (or already finished).
7. Wait until the workflow shows a green checkmark.

## Find Your Live URL

After deployment succeeds:

1. Open the completed workflow run in Actions.
2. Open the deploy step summary.
3. Click the page_url link.

## First Deployment Timing

- First deploy can take a few minutes.
- Later updates are usually faster.

## How Updates Work

Any time you edit content and commit to main:

- GitHub Actions rebuilds the site
- GitHub Pages publishes the new version automatically

No paid hosting is required.

## Troubleshooting

If the site does not load correctly:

1. Check Actions for failed workflow steps.
2. Confirm portfolio-config.json has correct:
   - site.repository.owner
   - site.repository.name
3. Confirm Pages source is GitHub Actions.
4. Wait 2 to 5 minutes and refresh.
