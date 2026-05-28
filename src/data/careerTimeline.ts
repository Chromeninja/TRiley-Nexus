/**
 * Career timeline data types
 * Used by multiple components and pages to organize projects by year/month
 */

import type { Project } from "./projects";

/** Single month group containing projects that started in that month */
export interface TimelineMonthGroup {
  key: string;
  month: number;
  monthLabel: string;
  projects: Project[];
}

/** Single year group containing all months within that year */
export interface TimelineYearGroup {
  year: number;
  key: string;
  months: TimelineMonthGroup[];
}
