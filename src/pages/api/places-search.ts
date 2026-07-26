import type { APIRoute } from "astro";
import { GOOGLE_MAPS_KEY, GOOGLE_PLACES_KEY } from "astro:env/server";

import { buildStaticMapUrl } from "../../helpers/googleStaticMap";
import { isOwner } from "../../helpers/verifyNetlifyIdentity";

export const prerender = false;

type NormalisedPlace = {
  address: string;
  category: null | string;
  city: string;
  id: string;
  lat: number;
  lng: number;
  mapUrl: null | string;
  name: string;
  summary: null | string;
  url: string;
};

type SearchBody = {
  lat?: number;
  lng?: number;
  mode: "nearby" | "text";
  query?: string;
  radius?: number;
};

// Only ask Google for the fields we actually surface — the field mask keeps the
// request in a cheaper Places API SKU and avoids over-fetching.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.addressComponents",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
].join(",");

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status,
  });

// Foursquare gave us a plain `city`; Google returns structured address
// components, so pick the most city-like one available.
const cityFromComponents = (components: { longText?: string; types?: string[] }[] = []): string => {
  const byType = (type: string) =>
    components.find((component) => component.types?.includes(type))?.longText ?? "";
  return (
    byType("postal_town") ||
    byType("locality") ||
    byType("administrative_area_level_2") ||
    byType("administrative_area_level_1") ||
    ""
  );
};

const normalise = (place: {
  addressComponents?: { longText?: string; types?: string[] }[];
  displayName?: { text?: string };
  editorialSummary?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  id: string;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
}): NormalisedPlace => {
  const lat = place.location?.latitude ?? 0;
  const lng = place.location?.longitude ?? 0;
  return {
    address: place.formattedAddress ?? "",
    category: place.primaryTypeDisplayName?.text ?? null,
    city: cityFromComponents(place.addressComponents),
    id: place.id,
    lat,
    lng,
    mapUrl: buildStaticMapUrl(lat, lng),
    name: place.displayName?.text ?? "",
    summary: place.editorialSummary?.text ?? null,
    url: place.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${place.id}`,
  };
};

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;

  if (!(await isOwner(request.headers.get("authorization"), origin))) {
    return new Response("", { status: 403 });
  }

  // Prefer a dedicated, non-referrer-restricted Places key; fall back to the
  // Maps key (which works only if it is not referrer-restricted).
  const apiKey = GOOGLE_PLACES_KEY ?? GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return json({ message: "GOOGLE_PLACES_KEY / GOOGLE_MAPS_KEY not configured" }, 500);
  }

  const body = (await request.json()) as SearchBody;

  let endpoint: string;
  let payload: Record<string, unknown>;

  if (body.mode === "nearby") {
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return json({ message: "lat and lng are required for a nearby search" }, 400);
    }
    endpoint = "https://places.googleapis.com/v1/places:searchNearby";
    payload = {
      locationRestriction: {
        circle: {
          center: { latitude: body.lat, longitude: body.lng },
          radius: body.radius ?? 1000,
        },
      },
      maxResultCount: 20,
      rankPreference: "DISTANCE",
    };
  } else {
    if (!body.query?.trim()) {
      return json({ message: "query is required for a text search" }, 400);
    }
    endpoint = "https://places.googleapis.com/v1/places:searchText";
    payload = {
      maxResultCount: 20,
      textQuery: body.query.trim(),
    };
    // Bias (not restrict) towards the user's location when we have it, so a
    // search for "coffee" prefers nearby cafés without hiding far-away matches.
    if (typeof body.lat === "number" && typeof body.lng === "number") {
      payload.locationBias = {
        circle: {
          center: { latitude: body.lat, longitude: body.lng },
          radius: body.radius ?? 5000,
        },
      };
    }
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    method: "POST",
  });

  if (!response.ok) {
    const raw = await response.text();
    console.error("Google Places error:", response.status, raw);
    // Forward Google's own error message (e.g. "API keys with referer
    // restrictions cannot be used with this API") so it surfaces in the UI.
    let detail = raw;
    try {
      detail = (JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? raw;
    } catch {
      // Non-JSON body; keep the raw text.
    }
    return json({ detail, message: "Google Places request failed", status: response.status }, 502);
  }

  const data = (await response.json()) as { places?: Parameters<typeof normalise>[0][] };
  return json({ results: (data.places ?? []).map(normalise) }, 200);
};
