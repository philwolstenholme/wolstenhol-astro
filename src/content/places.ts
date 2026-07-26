import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { AIRTABLE_KEY, FOURSQUARE_OAUTH_TOKEN } from "astro:env/server";
import { sampleSize, shuffle, sortBy } from "es-toolkit";

import { buildStaticMapUrl } from "../helpers/googleStaticMap";

// Places come from two sources that are shown side by side:
//   - Foursquare "venue likes" — the legacy source. Foursquare has wound the
//     service down, so this is best-effort: if the token is missing or the API
//     no longer answers, it simply contributes nothing.
//   - An Airtable "Places" table — the new source, populated by the /add-place
//     mini app from Google Maps results.
// Both are normalised to the same shape so PlacesCard can render either.
const BASE_ID = "appT2NMQ7UD8T2smq";
const TABLE = "Places";
const PLACES_COUNT = 9;

type Place = {
  address: string;
  city: string;
  id: string;
  lat: number;
  likedAt: null | string;
  lng: number;
  mapUrl: null | string;
  name: string;
  source: "airtable" | "foursquare";
  tip: null | string;
  url?: string;
};

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

const loadFoursquarePlaces = async (): Promise<Place[]> => {
  if (!FOURSQUARE_OAUTH_TOKEN) {
    return [];
  }

  try {
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

    const venues: {
      id: string;
      location: {
        address?: string;
        city?: string;
        formattedAddress?: string[];
        lat: number;
        lng: number;
      };
      name: string;
      ratedAt?: number;
      tipHint?: string;
      url?: string;
    }[] = data.response?.venues?.items ?? [];

    return venues.map((venue) => ({
      address: venue.location.formattedAddress?.[0] ?? venue.location.address ?? "",
      city: venue.location.city ?? "",
      id: `fsq-${venue.id}`,
      lat: venue.location.lat,
      likedAt: venue.ratedAt ? new Date(venue.ratedAt * 1000).toISOString() : null,
      lng: venue.location.lng,
      mapUrl: buildStaticMapUrl(venue.location.lat, venue.location.lng),
      name: venue.name,
      source: "foursquare",
      tip: venue.tipHint ?? null,
      url: venue.url ?? `https://foursquare.com/v/${venue.id}`,
    }));
  } catch (error) {
    console.warn("Places: Foursquare fetch failed, continuing with Airtable only:", error);
    return [];
  }
};

// Google's formattedAddress repeats the place name and trails the postcode,
// city and country (e.g. "The Rat & Pigeon, 33 Back Piccadilly, Manchester
// M1 1HP, UK"). Reduce it to just the street line so Airtable places read like
// the old Foursquare ones ("33 Back Piccadilly"), with the city shown
// separately by the card. Idempotent, so an already-clean address is unchanged.
const simplifyAddress = (address: string, name: string, city: string): string => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  // Skip a leading segment that just repeats the place name; the next segment
  // is the street line.
  const start = name && parts[0].toLowerCase() === name.trim().toLowerCase() ? 1 : 0;
  const street = parts[start] ?? parts[0];
  // If that segment is really the city (e.g. "Name, City, Country"), drop it so
  // the separately-rendered city is not duplicated.
  return city && street.toLowerCase() === city.trim().toLowerCase() ? "" : street;
};

const loadAirtablePlaces = async (): Promise<Place[]> => {
  if (!AIRTABLE_KEY) {
    console.warn("Places: AIRTABLE_KEY not set, skipping Airtable fetch");
    return [];
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}?maxRecords=200`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { records: PlaceRecord[] };

    // Only records with coordinates can render a map, so drop anything without
    // them rather than shipping a broken card.
    return data.records
      .filter(
        (record) => typeof record.fields.lat === "number" && typeof record.fields.lng === "number",
      )
      .map((record) => {
        const lat = record.fields.lat as number;
        const lng = record.fields.lng as number;
        const name = record.fields.name ?? "";
        const city = record.fields.city ?? "";
        return {
          address: simplifyAddress(record.fields.address ?? "", name, city),
          city,
          id: record.id,
          lat,
          likedAt: record.fields.likedAt ?? record.createdTime ?? null,
          lng,
          mapUrl: buildStaticMapUrl(lat, lng),
          name,
          source: "airtable" as const,
          tip: record.fields.tip ?? null,
          url: record.fields.url ?? undefined,
        };
      });
  } catch (error) {
    console.error("Places: Airtable fetch failed:", error);
    return [];
  }
};

// A place re-saved via the new app could also exist in the Foursquare likes;
// prefer the Airtable copy and drop the legacy duplicate.
const dedupeKey = (place: Place): string =>
  `${place.name.toLowerCase()}|${place.lat.toFixed(4)}|${place.lng.toFixed(4)}`;

// Guarantee the newer Airtable places appear alongside the legacy Foursquare
// ones: reserve up to a third of the slots for Airtable, fill the rest from
// Foursquare, then shuffle so the mix is randomised rather than grouped.
const pickMixed = (airtable: Place[], foursquare: Place[]): Place[] => {
  if (airtable.length === 0) {
    return sampleSize(foursquare, Math.min(PLACES_COUNT, foursquare.length));
  }
  if (foursquare.length === 0) {
    return sampleSize(airtable, Math.min(PLACES_COUNT, airtable.length));
  }

  const newSlots = Math.min(airtable.length, Math.max(1, Math.round(PLACES_COUNT / 3)));
  const chosenNew = sampleSize(airtable, newSlots);
  const remaining = PLACES_COUNT - chosenNew.length;
  const chosenOld = sampleSize(foursquare, Math.min(remaining, foursquare.length));
  return shuffle([...chosenNew, ...chosenOld]);
};

export const places = defineCollection({
  loader: async () => {
    const [airtable, foursquareAll] = await Promise.all([
      loadAirtablePlaces(),
      loadFoursquarePlaces(),
    ]);

    const airtableKeys = new Set(airtable.map(dedupeKey));
    const foursquare = foursquareAll.filter((place) => !airtableKeys.has(dedupeKey(place)));

    // Newest first within each source before sampling, so the reserved Airtable
    // slots lean towards recent additions.
    const byRecency = (list: Place[]) => sortBy(list, [(place) => place.likedAt ?? ""]).reverse();

    return pickMixed(byRecency(airtable), byRecency(foursquare));
  },
  schema: z.object({
    address: z.string(),
    city: z.string(),
    lat: z.number(),
    likedAt: z.string().nullable().optional(),
    lng: z.number(),
    mapUrl: z.string().nullable(),
    name: z.string(),
    source: z.enum(["airtable", "foursquare"]).optional(),
    tip: z.string().nullable().optional(),
    url: z.url().optional(),
  }),
});
