import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { AIRTABLE_KEY } from "astro:env/server";
import { sampleSize, sortBy } from "es-toolkit";

import { buildStaticMapUrl } from "../helpers/googleStaticMap";

// Places used to come from Foursquare "venue likes", but Foursquare shut its
// API down. They now come from an Airtable "Places" table that I populate with
// the /add-place mini app. The fields mirror the old Foursquare shape so the
// PlacesCard component did not have to change.
const BASE_ID = "appT2NMQ7UD8T2smq";
const TABLE = "Places";
const PLACES_COUNT = 9;

type PlaceRecord = {
  createdTime?: string;
  fields: {
    address?: string;
    city?: string;
    lat?: number;
    likedAt?: string;
    lng?: number;
    name?: string;
    tip?: string;
    url?: string;
  };
  id: string;
};

export const places = defineCollection({
  loader: async () => {
    if (!AIRTABLE_KEY) {
      console.warn("Places: AIRTABLE_KEY not set, skipping fetch");
      return [];
    }

    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?maxRecords=200`,
        { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } },
      );

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { records: PlaceRecord[] };

      // Only records with coordinates can render a map, so drop anything without
      // them rather than shipping a broken card.
      const located = data.records.filter(
        (record) => typeof record.fields.lat === "number" && typeof record.fields.lng === "number",
      );

      const sorted = sortBy(located, [
        (record) => record.fields.likedAt ?? record.createdTime ?? "",
      ]).reverse();

      return sampleSize(sorted, Math.min(PLACES_COUNT, sorted.length)).map((record) => {
        const lat = record.fields.lat as number;
        const lng = record.fields.lng as number;
        return {
          address: record.fields.address ?? "",
          city: record.fields.city ?? "",
          id: record.id,
          lat,
          likedAt: record.fields.likedAt ?? record.createdTime ?? null,
          lng,
          mapUrl: buildStaticMapUrl(lat, lng),
          name: record.fields.name ?? "",
          tip: record.fields.tip ?? null,
          url: record.fields.url ?? undefined,
        };
      });
    } catch (error) {
      console.error("Places (Airtable) fetch failed:", error);
      return [];
    }
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
