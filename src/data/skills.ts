// ============================================================
// SKILLS & CAPABILITIES DATA
// ============================================================

export interface SkillGroup {
  label: string;
  icon: string;
  skills: string[];
}

import { siteConfig } from "./siteConfig";

export const skillGroups: SkillGroup[] = siteConfig.skills.groups;

export const coreStrengths = siteConfig.skills.coreStrengths;
