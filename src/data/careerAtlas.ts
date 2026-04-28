// ============================================================
// CAREER TIMELINE ERAS — Pure Data Loader
// ============================================================
// This file loads career era definitions from portfolio-config.json
// (via siteConfig.ts). All era data is now in JSON format
// for easy fork customization.
//
// To customize your timeline eras:
// → Edit portfolio-config.json, find the "careerEras" section
// → Modify labels, years, and themes
// → Add or remove eras as needed
// → npm run build will automatically load the changes
// ============================================================

import { siteConfig } from "./siteConfig";

export type { CareerAtlasEraDefinition } from "./siteConfig";

export const careerAtlasEras = siteConfig.careerEras;
