import { createHmac } from "crypto";

import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { FOURSQUARE_OAUTH_TOKEN, GOOGLE_MAPS_KEY, GOOGLE_MAPS_SECRET } from "astro:env/server";
import { sampleSize, sortBy } from "es-toolkit";

const PLACES_COUNT = 9;

function buildMapUrl(lat: number, lng: number): null | string {
  if (!GOOGLE_MAPS_KEY) {
    return null;
  }
  const base = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=365x182&maptype=roadmap&key=${GOOGLE_MAPS_KEY}&format=png&visual_refresh=true&map_id=db8ea46f9ea0d213&scale=2`;
  return GOOGLE_MAPS_SECRET ? signGoogleMapsUrl(base, GOOGLE_MAPS_SECRET) : base;
}

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
    if (!FOURSQUARE_OAUTH_TOKEN) {
      console.warn("Places: FOURSQUARE_OAUTH_TOKEN not set, skipping fetch");
      return [];
    }

    const response = await fetch(
      `https://api.foursquare.com/v2/users/self/venuelikes?oauth_token=${FOURSQUARE_OAUTH_TOKEN}&v=20151227&limit=200`,
    );

    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.meta?.code !== 200) {
      throw new Error(`Foursquare error: ${data.meta?.errorDetail}`);
    }

    const venues: any[] = data.response?.venues?.items ?? [];

    const sortedVenues = sortBy(venues, [(v) => v.ratedAt ?? 0]).reverse();

    return sampleSize(sortedVenues, PLACES_COUNT).map((v) => ({
      address: v.location.formattedAddress?.[0] ?? v.location.address ?? "",
      city: v.location.city ?? "",
      id: v.id,
      lat: v.location.lat,
      likedAt: v.ratedAt ? new Date(v.ratedAt * 1000).toISOString() : null,
      lng: v.location.lng,
      mapUrl: buildMapUrl(v.location.lat, v.location.lng),
      name: v.name,
      tip: v.tipHint ?? null,
      url: v.url ?? `https://foursquare.com/v/${v.id}`,
    }));
  },
  schema: z.object({
    address: z.string(),
    city: z.string(),
    lat: z.number(),
    likedAt: z.string().nullable().optional(),
    lng: z.number(),
    mapUrl: z.string().nullable(),
    name: z.string(),
    tip: z.string().nullable().optional(),
    url: z.url().optional(),
  }),
});
