/**
 * careerShared.ts
 * Shared utilities and state for career-related data aggregation.
 * Used by careerAtlas, careerNarrative, and careerTimeline modules.
 */

import { atlasFallbackColors } from "./projectThemes";
import { hashStringToIndex } from "./projectHelpers";
import type { CompanyProfile } from "./siteConfig";

export const currentCompanyProfiles: Record<string, CompanyProfile> = {};

export function setCurrentCompanyProfiles(
  profiles: Record<string, CompanyProfile>,
): void {
  // Replace contents rather than merge so each aggregation entry point
  // starts from a clean snapshot, matching the original reassignment
  // semantics before this module was split out of projects.ts.
  for (const key of Object.keys(currentCompanyProfiles)) {
    delete currentCompanyProfiles[key];
  }
  Object.assign(currentCompanyProfiles, profiles);
}

export function getPresentDate(): Date {
  // Day granularity keeps every "Present" timeline endpoint identical
  // within a build, so ongoing companies tie exactly and sort order is
  // deterministic instead of depending on sub-millisecond timing.
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function getFallbackColor(label: string): string {
  return atlasFallbackColors[
    hashStringToIndex(label, atlasFallbackColors.length)
  ];
}
