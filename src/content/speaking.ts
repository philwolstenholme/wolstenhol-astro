import { file } from "astro/loaders";
import { defineCollection, z } from "astro:content";

export const speaking = defineCollection({
  loader: file("./src/content/speaking.json"),
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("thumbnail"),
      href: z.string().url().optional(),
      imageSrc: z.string().url(),
      imageAlt: z.string().optional(),
      eventName: z.string(),
      talkTitle: z.string(),
    }),
    z.object({
      type: z.literal("quote"),
      href: z.string().url().optional(),
      quote: z.string(),
      attribution: z.string(),
    }),
  ]),
});
