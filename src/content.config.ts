import { defineCollection } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

const projectsCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    status: z.enum(["active", "completed", "archived", "concept"]),
    category: z.string(),
    tags: z.array(z.string()),
    organization: z.string().optional(),
    organizationUrl: z.string().url().optional(),
    roleTitle: z.string().optional(),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    timeframe: z.string().optional(),
    summary: z.string(),
    cardSummary: z.string().optional(),
    highlights: z.array(z.string()).max(3).optional(),
    problem: z.string().optional(),
    approach: z.string().optional(),
    outcome: z.string().optional(),
    skills: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    cover: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        }),
      )
      .optional(),
    media: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("image"),
            src: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
          }),
          z.object({
            type: z.literal("video"),
            src: z.string(),
            poster: z.string().optional(),
            caption: z.string().optional(),
          }),
        ]),
      )
      .optional(),
    featured: z.boolean(),
    order: z.number().int().optional(),
  }),
});

const aboutCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/about",
  }),
  schema: z.object({
    metaDescription: z.string(),
    backgroundParagraphs: z.array(z.string()),
    thinkItems: z.array(
      z.object({
        title: z.string(),
        text: z.string(),
      }),
    ),
    personalItems: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        body: z.string(),
      }),
    ),
    values: z.array(z.string()),
    profileMedia: z
      .object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      })
      .nullable()
      .optional(),
    additionalMedia: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .optional(),
    resume: z
      .object({
        title: z.string(),
        filePath: z.string(),
        lastUpdated: z.string(),
        summary: z.string().optional(),
      })
      .optional(),
  }),
});

const companyProfileSchema = z.object({
  summary: z.string(),
  companyInfo: z.string(),
  myTimeInfo: z.string(),
  longSummary: z.string().optional(),
  roleSummary: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  logo: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  color: z.string().optional(),
  tenureStart: z.string().optional(),
  tenureEnd: z.string().optional(),
  timelineRoles: z
    .array(
      z.object({
        label: z.string(),
        start: z.string(),
        end: z.string().optional(),
      }),
    )
    .optional(),
});

const companiesCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/companies",
  }),
  schema: z.object({
    profiles: z.record(z.string(), companyProfileSchema),
  }),
});

export const collections = {
  projects: projectsCollection,
  about: aboutCollection,
  companies: companiesCollection,
};
