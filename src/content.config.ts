import { defineCollection, z } from "astro:content";

const projectsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    status: z.enum(["active", "completed", "archived", "concept"]),
    category: z.string(),
    tags: z.array(z.string()),
    organization: z.string().optional(),
    timeframe: z.string().optional(),
    summary: z.string(),
    problem: z.string().optional(),
    approach: z.string().optional(),
    outcome: z.string().optional(),
    skills: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        }),
      )
      .optional(),
    featured: z.boolean(),
    order: z.number().int().optional(),
  }),
});

export const collections = {
  projects: projectsCollection,
};
