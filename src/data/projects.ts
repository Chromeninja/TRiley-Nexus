import { getCollection, type CollectionEntry } from "astro:content";

type ProjectCollectionEntry = CollectionEntry<"projects">;

export type Project = ProjectCollectionEntry["data"] & {
  slug: string;
};

export const projectStatusColors: Record<Project["status"], string> = {
  active: "badge-green",
  completed: "badge-cyan",
  archived: "badge-gray",
  concept: "badge-yellow",
};

export const projectStatusLabels: Record<Project["status"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  concept: "Concept",
};

function toProject(entry: ProjectCollectionEntry): Project {
  return {
    ...entry.data,
    slug: entry.id.replace(/\.md$/, ""),
  };
}

function sortByOrder(a: Project, b: Project): number {
  return (a.order ?? 99) - (b.order ?? 99);
}

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection("projects");
  return entries.map(toProject).sort(sortByOrder);
}

// Helper: get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.featured);
}

// Helper: get projects by category
export async function getProjectsByCategory(category: string): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.category === category);
}

// Helper: get all unique categories
export async function getCategories(): Promise<string[]> {
  const projects = await getProjects();
  return [...new Set(projects.map((p) => p.category))];
}

// Helper: get project by slug
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
}

// Helper: get active projects
export async function getActiveProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.status === "active").sort(sortByOrder);
}
