import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { DEV_TO_API_KEY } from "astro:env/server";

import { devtoArticleSchema } from "./schemas/devtoArticle";

const READING_LIST_TITLE_PREFIX = "What I've been reading";

export const devToPosts = defineCollection({
  loader: async () => {
    if (!DEV_TO_API_KEY) {
      console.warn("DEV.to posts: DEV_TO_API_KEY not set, skipping fetch");
      return [];
    }
    try {
      const response = await fetch("https://dev.to/api/articles/me", {
        headers: {
          "api-key": DEV_TO_API_KEY,
          Accept: "application/vnd.forem.api-v1+json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`DEV.to posts fetch failed: ${response.status} ${response.statusText}`);
      }

      const posts = (await response.json()) ?? [];

      return posts
        .filter((post: any) => !post.title.startsWith(READING_LIST_TITLE_PREFIX))
        .map((post: any) => ({ ...post, id: String(post.id) }));
    } catch (error) {
      console.error("DEV.to posts fetch failed:", error);
      return [];
    }
  },
  schema: devtoArticleSchema.extend({ id: z.string() }),
});
