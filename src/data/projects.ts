/**
 * projects.ts
 * Barrel entry point for project and career data.
 * Keeps the historical import path "../data/projects" working while the
 * implementation lives in focused modules.
 */

export * from "./projectsCore";

// Re-export theme constants and helpers for backward compatibility
export { projectStatusColors, projectStatusLabels } from "./projectThemes";
export {
  formatProjectDateRange,
  parseProjectDateValue,
} from "./projectHelpers";

// Re-export career-related data modules to maintain import compatibility
export * from "./careerTimeline";
export * from "./careerAtlas";
export * from "./careerNarrative";
export * from "./projectsPage";
