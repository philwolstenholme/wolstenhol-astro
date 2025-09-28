import { defineCollection, z } from "astro:content";

export const devToReadingList = defineCollection({
  type: "content_layer",
  loader: async () => {
    try {
      const response = await fetch("https://dev.to/api/readinglist", {
        headers: {
          "API-key": import.meta.env.DEV_TO_API_KEY,
          Accept: "application/vnd.forem.api-v1+json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch DEV.to reading list: ${response.statusText}`,
        );
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
    article: z.object({
      id: z.number(),
      type_of: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      cover_image: z.string().nullable(),
      published: z.boolean().optional(),
      published_at: z.string().nullable(),
      tag_list: z.array(z.string()).optional(),
      slug: z.string(),
      path: z.string(),
      url: z.string(),
      canonical_url: z.string(),
      comments_count: z.number(),
      positive_reactions_count: z.number(),
      public_reactions_count: z.number(),
      page_views_count: z.number().optional(),
      published_timestamp: z.string().nullable(),
      body_markdown: z.string().optional(),
      user: z.object({
        user_id: z.number().optional(),
        name: z.string(),
        username: z.string(),
        twitter_username: z.string().nullable(),
        github_username: z.string().nullable(),
        website_url: z.string().nullable(),
        profile_image: z.string(),
        profile_image_90: z.string(),
      }),
      reading_time_minutes: z.number(),
      organization: z
        .object({
          name: z.string(),
          username: z.string(),
          slug: z.string(),
          profile_image: z.string(),
          profile_image_90: z.string(),
        })
        .nullable()
        .optional(),
      flare_tag: z
        .object({
          name: z.string(),
          bg_color_hex: z.string(),
          text_color_hex: z.string(),
        })
        .nullable()
        .optional(),
    }),
  }),
});
