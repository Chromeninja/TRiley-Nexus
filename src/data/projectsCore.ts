/**
 * projectsCore.ts
 * Core project types, loading, and sorting helpers.
 * Career data modules import from here (not from projects.ts) so the
 * projects.ts barrel can re-export them without an import cycle.
 */

import { getCollection, type CollectionEntry } from "astro:content";
import { getCompanyProfiles } from "./companyProfiles";
import { projectStatusSortOrder } from "./projectThemes";
import { parseProjectDateValue } from "./projectHelpers";

type ProjectCollectionEntry = CollectionEntry<"projects">;

export type Project = ProjectCollectionEntry["data"] & {
  slug: string;
  organizationShortName?: string;
};

function toProject(entry: ProjectCollectionEntry): Project {
  return {
    ...entry.data,
    slug: entry.id.replace(/\.md$/, ""),
  };
}

function sortByOrder(a: Project, b: Project): number {
  const statusDifference =
    projectStatusSortOrder[a.status] - projectStatusSortOrder[b.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return (a.order ?? 99) - (b.order ?? 99);
}

function resolveProjectRecencyDate(project: Project, referenceNow: Date): Date {
  if (project.status === "active" || project.status === "concept") {
    return referenceNow;
  }

  const endedAt = project.endedAt?.trim();
  if (endedAt) {
    const parsedEnd = parseProjectDateValue(endedAt, "end");
    if (parsedEnd) {
      return parsedEnd;
    }
  }

  const startedAt = project.startedAt?.trim();
  if (startedAt) {
    const parsedStart = parseProjectDateValue(startedAt, "start");
    if (parsedStart) {
      return parsedStart;
    }
  }

  return new Date(0);
}

export function sortProjectsByOrderThenRecency(
  a: Project,
  b: Project,
  referenceNow: Date = new Date(),
): number {
  const statusDifference =
    projectStatusSortOrder[a.status] - projectStatusSortOrder[b.status];
  if (statusDifference !== 0) {
    return statusDifference;
  }

  const orderDifference = (a.order ?? 99) - (b.order ?? 99);
  if (orderDifference !== 0) {
    return orderDifference;
  }

  const recencyDiff =
    resolveProjectRecencyDate(b, referenceNow).getTime() -
    resolveProjectRecencyDate(a, referenceNow).getTime();
  if (recencyDiff !== 0) {
    return recencyDiff;
  }

  return a.title.localeCompare(b.title);
}

export function hasDetailedProjectWriteup(
  project: Pick<Project, "problem" | "approach" | "outcome">,
): boolean {
  return Boolean(
    project.problem?.trim() &&
      project.approach?.trim() &&
      project.outcome?.trim(),
  );
}

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection("projects");
  const companyProfiles = await getCompanyProfiles();

  return entries
    .map(toProject)
    .map((project) => {
      if (!project.organization) {
        return project;
      }

      const companyProfile = companyProfiles[project.organization];
      if (!companyProfile?.shortName?.trim()) {
        return project;
      }

      return {
        ...project,
        organizationShortName: companyProfile.shortName.trim(),
      };
    })
    .sort(sortByOrder);
}

export async function getActiveProjects(): Promise<Project[]> {
  const referenceNow = new Date();
  const projects = await getProjects();
  return projects
    .filter((p) => p.status === "active")
    .sort((a, b) => sortProjectsByOrderThenRecency(a, b, referenceNow));
}
