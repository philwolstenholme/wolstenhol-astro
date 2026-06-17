import { defineCollection, z } from "astro:content";
import { GOOGLE_MAPS_KEY, GOOGLE_MAPS_SECRET } from "astro:env/server";
import { createHmac } from "crypto";
import placesData from "./places.json";

function signGoogleMapsUrl(url: string, secret: string): string {
  const urlObj = new URL(url);
  const pathAndQuery = urlObj.pathname + urlObj.search;
  const normalBase64 = secret.replace(/-/g, "+").replace(/_/g, "/");
  const keyBytes = Buffer.from(normalBase64, "base64");
  const signature = createHmac("sha1", keyBytes)
    .update(pathAndQuery)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${url}&signature=${signature}`;
}

export const places = defineCollection({
  loader: async () => {
    return placesData.map((place) => {
      let mapUrl: string | null = null;
      if (GOOGLE_MAPS_KEY) {
        const baseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${place.lat},${place.lng}&zoom=13&size=365x182&maptype=roadmap&key=${GOOGLE_MAPS_KEY}&format=png&visual_refresh=true&map_id=db8ea46f9ea0d213&scale=2`;
        mapUrl = GOOGLE_MAPS_SECRET ? signGoogleMapsUrl(baseUrl, GOOGLE_MAPS_SECRET) : baseUrl;
      }
      return { ...place, mapUrl };
    });
  },
  schema: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string(),
    url: z.string().url().optional(),
    tip: z.string().optional(),
    likedAt: z.string().optional(),
    mapUrl: z.string().nullable(),
  }),
});
