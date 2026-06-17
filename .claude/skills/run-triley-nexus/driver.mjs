#!/usr/bin/env node
/**
 * Smoke driver for TRiley-Nexus (Astro 6 portfolio site).
 *
 * Usage:
 *   node .claude/skills/run-triley-nexus/driver.mjs [--screenshot <slug>]
 *
 * Env:
 *   BASE_URL   dev server base (default: http://localhost:4321)
 *   OUT_DIR    screenshot dir  (default: /tmp/shots/triley-nexus)
 *
 * With no args: screenshots every page, prints HTTP status.
 * With --screenshot <slug>: single page only (e.g. --screenshot about).
 */

import { chromium } from '/home/chrome/.local/npm/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT  = process.env.OUT_DIR  ?? '/tmp/shots/triley-nexus';
mkdirSync(OUT, { recursive: true });

const ALL_ROUTES = [
  { route: '/',          slug: 'home' },
  { route: '/about',     slug: 'about' },
  { route: '/projects',  slug: 'projects' },
  { route: '/career',    slug: 'career' },
  { route: '/how-i-work',slug: 'how-i-work' },
  { route: '/now',       slug: 'now' },
  { route: '/contact',   slug: 'contact' },
];

const argIdx = process.argv.indexOf('--screenshot');
const target  = argIdx !== -1 ? process.argv[argIdx + 1] : null;
const routes  = target
  ? ALL_ROUTES.filter(r => r.slug === target || r.route === target)
  : ALL_ROUTES;

if (routes.length === 0) {
  console.error(`Unknown slug "${target}". Valid: ${ALL_ROUTES.map(r => r.slug).join(', ')}`);
  process.exit(1);
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
const page    = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors  = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

let failed = 0;
for (const { route, slug } of routes) {
  try {
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
    const file = `${OUT}/${slug}.png`;
    await page.screenshot({ path: file });
    const ok   = resp.status() < 400;
    console.log(`${ok ? '✓' : '✗'} ${resp.status()} ${route} → ${file}`);
    if (!ok) failed++;
  } catch (e) {
    console.error(`✗ FAIL ${route}: ${e.message}`);
    failed++;
  }
}

if (errors.length) {
  console.warn('\nConsole errors:');
  errors.forEach(e => console.warn(' ', e));
}

await browser.close();
process.exit(failed > 0 ? 1 : 0);
