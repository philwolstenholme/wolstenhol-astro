import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import speakingItems from "./speaking.json";

export const speaking = defineCollection({
  loader: () =>
    speakingItems.map((item, index) => ({
      ...item,
      id: String(index),
    })),
  schema: z.discriminatedUnion("type", [
    z.object({
      eventName: z.string(),
      href: z.url().optional(),
      imageAlt: z.string().optional(),
      imageSrc: z.url(),
      talkTitle: z.string(),
      type: z.literal("thumbnail"),
    }),
    z.object({
      attribution: z.string(),
      href: z.url().optional(),
      quote: z.string(),
      type: z.literal("quote"),
    }),
  ]),
});
