import { defineCollection, z } from "astro:content";
import { devtoArticleSchema } from "./schemas/devtoArticle";

export const devToPosts = defineCollection({
  loader: async () => {
    const response = await fetch("https://dev.to/api/articles/me", {
      headers: {
        "api-key": import.meta.env.DEV_TO_API_KEY,
        Accept: "application/vnd.forem.api-v1+json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `DEV.to posts fetch failed: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const posts = (await response.json()) ?? [];

    return posts
      .filter((post: any) => !post.title.startsWith("What I've been reading"))
      .map((post: any) => ({
        ...post,
        id: String(post.id),
      }));
  },
  schema: devtoArticleSchema.extend({ id: z.string() }).transform((data) => ({
    ...data,
  })),
});
