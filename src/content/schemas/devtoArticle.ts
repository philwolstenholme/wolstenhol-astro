import { z } from "astro/zod";

export const devtoArticleSchema = z.object({
  body_markdown: z.string().optional(),
  canonical_url: z.string(),
  comments_count: z.number(),
  cover_image: z.string().nullable(),
  description: z.string().nullable(),
  flare_tag: z
    .object({
      bg_color_hex: z.string(),
      name: z.string(),
      text_color_hex: z.string(),
    })
    .nullable()
    .optional(),
  id: z.number(),
  organization: z
    .object({
      name: z.string(),
      profile_image: z.string(),
      profile_image_90: z.string(),
      slug: z.string(),
      username: z.string(),
    })
    .nullable()
    .optional(),
  page_views_count: z.number().optional(),
  path: z.string(),
  positive_reactions_count: z.number(),
  public_reactions_count: z.number(),
  published: z.boolean().optional(),
  published_at: z.string().nullable(),
  published_timestamp: z.string().nullable(),
  reading_time_minutes: z.number(),
  slug: z.string(),
  tag_list: z.array(z.string()).optional(),
  title: z.string(),
  type_of: z.string(),
  url: z.string(),
  user: z.object({
    github_username: z.string().nullable(),
    name: z.string(),
    profile_image: z.string(),
    profile_image_90: z.string(),
    twitter_username: z.string().nullable(),
    user_id: z.number().optional(),
    username: z.string(),
    website_url: z.string().nullable(),
  }),
});
