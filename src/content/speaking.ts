import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import speakingItems from "./speaking.json";

export const speaking = defineCollection({
  // Inline loader: assign zero-padded numeric IDs so Astro's alphabetical
  // sort of entry IDs ("00", "01", …) preserves the JSON array order.
  loader: () =>
    speakingItems.map((item, index) => ({
      ...item,
      id: String(index).padStart(2, "0"),
    })),
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("thumbnail"),
      href: z.url().optional(),
      imageSrc: z.url(),
      imageAlt: z.string().optional(),
      eventName: z.string(),
      talkTitle: z.string(),
    }),
    z.object({
      type: z.literal("quote"),
      href: z.url().optional(),
      quote: z.string(),
      attribution: z.string(),
    }),
  ]),
});
