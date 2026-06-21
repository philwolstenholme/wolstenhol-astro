import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { DEV_TO_API_KEY } from "astro:env/server";

import { devtoArticleSchema } from "./schemas/devtoArticle";

export const devToReadingList = defineCollection({
  loader: async () => {
    if (!DEV_TO_API_KEY) {
      console.warn("DEV.to reading list: DEV_TO_API_KEY not set, skipping fetch");
      return [];
    }
    try {
      const response = await fetch("https://dev.to/api/readinglist?per_page=50", {
        headers: {
          "API-key": DEV_TO_API_KEY,
          Accept: "application/vnd.forem.api-v1+json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch DEV.to reading list: ${response.statusText}`);
      }

      const readingList = await response.json();

      return readingList.map((item: any) => ({
        ...item,
        id: String(item.id),
      }));
    } catch (error) {
      console.error("Error fetching DEV.to reading list:", error);
      return [];
    }
  },
  schema: z.object({
    id: z.string(),
    status: z.string(),
    created_at: z.string().nullable(),
    article: devtoArticleSchema,
  }),
});
