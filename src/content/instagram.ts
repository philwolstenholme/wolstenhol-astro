import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { InstagramScraper } from "@aduptive/instagram-scraper";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const CLOUDINARY_PROXY = "/proxy/cloudinary";
const CARD_WIDTH = 365;

function cloudinaryImageUrl(id: string, width: number): string {
  return `${CLOUDINARY_PROXY}/image/upload/f_auto,q_auto,w_${width}/11ty/instagram/${id}`;
}

function cloudinaryVideoUrl(id: string): string {
  return `${CLOUDINARY_PROXY}/video/upload/ac_none,f_auto/11ty/instagram/${id}`;
}

type RawPost = {
  id: string;
  timestamp: number;
  url: string;
  caption?: string | null;
  likes: number;
  comments: number;
  is_video: boolean;
};

function mapPost(post: RawPost) {
  const caption = post.caption || null;
  const isParty = !!(
    caption &&
    (caption.includes("birthday") ||
      caption.includes("🎉") ||
      caption.includes("🥳") ||
      caption.includes("🎂"))
  );
  return {
    id: post.id,
    takenAt: post.timestamp,
    cloudinaryUrl: cloudinaryImageUrl(post.id, CARD_WIDTH),
    cloudinarySrcset: [1, 2, 3]
      .map((n) => `${cloudinaryImageUrl(post.id, CARD_WIDTH * n)} ${CARD_WIDTH * n}w`)
      .join(", "),
    link: post.url,
    caption,
    likeCount: post.likes,
    commentCount: post.comments,
    locationName: null,
    isVideo: post.is_video,
    isParty,
    videoUrl: post.is_video ? cloudinaryVideoUrl(post.id) : null,
    accessibilityCaption: null,
  };
}

const FALLBACK_PATH = join(process.cwd(), "src/data/instagram-fallback.json");

function loadFallback(): RawPost[] | null {
  if (!existsSync(FALLBACK_PATH)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(FALLBACK_PATH, "utf-8")) as RawPost[];
  } catch {
    return null;
  }
}

export const instagram = defineCollection({
  loader: async () => {
    try {
      const scraper = new InstagramScraper();
      const results = await scraper.getPosts("philw_", 20);

      if (results.success && results.posts && results.posts.length > 0) {
        console.log(`Instagram: ${results.posts.length} posts fetched`);
        return results.posts.map(mapPost);
      }

      console.warn(`Instagram: scraper returned no results — ${results.error ?? "unknown reason"}`);
    } catch (error) {
      console.error("Instagram: scraper failed", error);
    }

    const fallback = loadFallback();
    if (fallback) {
      console.log(`Instagram: using ${fallback.length} posts from fallback JSON`);
      return fallback.map(mapPost);
    }

    console.warn("Instagram: no fallback data available, returning empty");
    return [];
  },
  schema: z.object({
    takenAt: z.number(),
    cloudinaryUrl: z.string(),
    cloudinarySrcset: z.string(),
    link: z.string(),
    caption: z.string().nullable(),
    likeCount: z.number(),
    commentCount: z.number(),
    locationName: z.string().nullable(),
    isVideo: z.boolean(),
    isParty: z.boolean(),
    videoUrl: z.string().nullable(),
    accessibilityCaption: z.string().nullable(),
  }),
});
