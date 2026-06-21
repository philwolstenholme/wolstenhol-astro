import { InstagramScraper } from "@aduptive/instagram-scraper";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const CLOUDINARY_PROXY = "https://wolstenhol.me/proxy/cloudinary";
const CARD_WIDTH = 365;

function cloudinaryImageUrl(id: string, width: number): string {
  return `${CLOUDINARY_PROXY}/image/upload/f_auto,q_auto,w_${width}/11ty/instagram/${id}`;
}

function cloudinaryVideoUrl(id: string): string {
  return `${CLOUDINARY_PROXY}/video/upload/ac_none,f_auto/11ty/instagram/${id}`;
}

export const instagram = defineCollection({
  loader: async () => {
    try {
      const scraper = new InstagramScraper();
      const results = await scraper.getPosts("philw_", 20);

      if (!results.success || !results.posts) {
        console.warn(`Instagram: scraper failed - ${results.error}`);
        return [];
      }

      console.log(`Instagram: ${results.posts.length} posts fetched`);

      return results.posts
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((post) => {
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
        });
    } catch (error) {
      console.error("Instagram: scraper failed", error);
      return [];
    }
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
