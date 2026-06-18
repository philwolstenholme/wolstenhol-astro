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

interface InstagramNode {
  __typename: string;
  id: string;
  shortcode: string;
  display_url: string;
  is_video: boolean;
  video_url?: string;
  taken_at_timestamp: number;
  edge_media_to_caption: { edges: { node: { text: string } }[] };
  location: { name: string } | null;
  edge_media_preview_like: { count: number };
  edge_media_to_comment: { count: number };
  accessibility_caption: string | null;
  dimensions: { height: number; width: number };
  edge_sidecar_to_children?: {
    edges: { node: { __typename: string; is_video: boolean; video_url?: string } }[];
  };
}

export const instagram = defineCollection({
  loader: async () => {
    try {
      const response = await fetch(
        "https://gist.githubusercontent.com/philwolstenholme/0d8f663f0d5857d1e5d43aad021d9c7e/raw/instagram.json",
      );

      if (!response.ok) {
        console.warn(`Instagram: Gist fetch failed ${response.status}`);
        return [];
      }

      const data = await response.json();
      const edges: { node: InstagramNode }[] =
        data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];

      console.log(`Instagram: ${edges.length} posts fetched`);

      return edges.map((edge) => {
        const node = edge.node;

        // For sidecar (carousel) posts, check if the first child is a video.
        const firstChild = node.edge_sidecar_to_children?.edges?.[0]?.node;
        const isVideo =
          firstChild?.__typename === "GraphVideo" ? firstChild.is_video : node.is_video;

        const caption = node.edge_media_to_caption.edges[0]?.node.text ?? null;
        const isParty = !!(
          caption &&
          (caption.includes("birthday") ||
            caption.includes("🎉") ||
            caption.includes("🥳") ||
            caption.includes("🎂"))
        );

        return {
          id: node.id,
          takenAt: node.taken_at_timestamp,
          cloudinaryUrl: cloudinaryImageUrl(node.id, CARD_WIDTH),
          cloudinarySrcset: [1, 2, 3]
            .map((n) => `${cloudinaryImageUrl(node.id, CARD_WIDTH * n)} ${CARD_WIDTH * n}w`)
            .join(", "),
          link: `https://instagram.com/p/${node.shortcode}`,
          caption,
          likeCount: node.edge_media_preview_like.count,
          commentCount: node.edge_media_to_comment.count,
          locationName: node.location?.name ?? null,
          isVideo,
          isParty,
          videoUrl: isVideo ? cloudinaryVideoUrl(node.id) : null,
          accessibilityCaption: node.accessibility_caption ?? null,
          dimensions: node.dimensions,
        };
      });
    } catch (error) {
      console.error("Instagram: fetch failed", error);
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
    dimensions: z.object({ height: z.number(), width: z.number() }),
  }),
});
