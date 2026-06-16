import { defineCollection, z } from "astro:content";
import { DEV_TO_API_KEY } from "astro:env/server";
import { devtoArticleSchema } from "./schemas/devtoArticle";

export const devToReadingList = defineCollection({
  loader: async () => {
    if (!DEV_TO_API_KEY) {
      console.warn("DEV.to reading list: DEV_TO_API_KEY not set, skipping fetch");
      return [];
    }
    try {
      const response = await fetch("https://dev.to/api/readinglist", {
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

      // Map the response items to match our schema
      return readingList.map((item: any) => ({
        ...item,
        id: String(item.id), // Convert ID to string to match schema
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
