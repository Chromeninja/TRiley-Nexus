// ============================================================
// COMPANY PROFILES — Pure Data Loader
// ============================================================
// This file loads company profiles from portfolio-config.json
// (via siteConfig.ts). All company data is now in JSON format
// for easy fork customization.
//
// To add, edit, or remove companies:
// → Edit portfolio-config.json, find the "companies" section
// → Add/modify/delete company entries
// → npm run build will automatically load the changes
// ============================================================

import { siteConfig } from "./siteConfig";

export type { CompanyProfile, CompanyTimelineRoleEntry } from "./siteConfig";

export const companyProfiles = siteConfig.companies;
