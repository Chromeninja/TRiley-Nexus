/**
 * projectsPage.ts
 * Projects page data aggregation.
 * Organizes projects into featured and categorized groups for display.
 */

import {
  getProjects,
  sortProjectsByOrderThenRecency,
  type Project,
} from "./projectsCore";

export interface ProjectsCategoryGroup {
  category: string;
  projects: Project[];
}

export interface ProjectsPageData {
  featuredProjects: Project[];
  categoryGroups: ProjectsCategoryGroup[];
  totalProjectCount: number;
}

export async function getProjectsPageData(
  featuredLimit = 6,
): Promise<ProjectsPageData> {
  const projects = await getProjects();
  const referenceNow = new Date();
  const sortByChronology = (a: Project, b: Project): number =>
    sortProjectsByOrderThenRecency(a, b, referenceNow);

  const explicitFeatured = projects
    .filter((project) => project.featured)
    .sort(sortByChronology);
  const nonFeatured = projects
    .filter((project) => !project.featured)
    .sort(sortByChronology);
  const featuredProjects = [...explicitFeatured, ...nonFeatured].slice(
    0,
    featuredLimit,
  );
  const featuredSlugs = new Set(
    featuredProjects.map((project) => project.slug),
  );

  const groupedByCategory = new Map<string, Project[]>();

  for (const project of projects.filter(
    (entry) => !featuredSlugs.has(entry.slug),
  )) {
    const category = project.category.trim() || "Other";
    const existing = groupedByCategory.get(category) ?? [];
    existing.push(project);
    groupedByCategory.set(category, existing);
  }

  const categoryGroups = [...groupedByCategory.entries()]
    .map(([category, categoryProjects]) => ({
      category,
      projects: categoryProjects.sort(sortByChronology),
    }))
    .sort((a, b) => {
      if (b.projects.length !== a.projects.length) {
        return b.projects.length - a.projects.length;
      }

      return a.category.localeCompare(b.category);
    });

  return {
    featuredProjects,
    categoryGroups,
    totalProjectCount: projects.length,
  };
}
