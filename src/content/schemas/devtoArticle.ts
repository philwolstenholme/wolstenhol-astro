import { z } from "astro:content";

export const devtoArticleSchema = z.object({
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
});
