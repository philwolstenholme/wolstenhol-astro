import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

export const portfolio = defineCollection({
  loader: glob({ base: "./src/content/portfolio", pattern: "**/*.md" }),
  schema: z.object({
    cloudinarySuffix: z.string().optional(),
    color: z.string().optional(),
    happyWithScreenshot: z.boolean().optional(),
    name: z.string(),
    permalink: z.union([z.boolean(), z.string()]).optional(),
    prevent_link: z.boolean().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    url: z.string().optional(),
    weight: z.number().optional(),
    work_tags: z.array(z.string()).optional(),
  }),
});
