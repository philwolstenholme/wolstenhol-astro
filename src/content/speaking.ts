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
