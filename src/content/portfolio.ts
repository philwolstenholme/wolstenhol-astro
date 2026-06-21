import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

export const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/portfolio" }),
  schema: z.object({
    name: z.string(),
    url: z.string().optional(),
    color: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    work_tags: z.array(z.string()).optional(),
    happyWithScreenshot: z.boolean().optional(),
    cloudinarySuffix: z.string().optional(),
    permalink: z.union([z.boolean(), z.string()]).optional(),
    weight: z.number().optional(),
    prevent_link: z.boolean().optional(),
  }),
});
