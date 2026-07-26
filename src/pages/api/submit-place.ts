import type { APIRoute } from "astro";
import { AIRTABLE_KEY, BUILD_HOOK_KEY } from "astro:env/server";

import { isOwner } from "../../helpers/verifyNetlifyIdentity";

export const prerender = false;

// Reuses the same base as the reading list; places live in their own "Places"
// table. See the mini app page for the field list this expects.
const AIRTABLE_BASE_ID = "appT2NMQ7UD8T2smq";
const AIRTABLE_TABLE = "Places";

type PlaceSubmission = {
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  name?: string;
  placeId?: string;
  tip?: string;
  url?: string;
};

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status,
  });

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    console.error("submit-place: no authentication details");
    return new Response("", { status: 403 });
  }

  if (!(await isOwner(authHeader, origin))) {
    console.log("submit-place: not the owner, refusing");
    return new Response("", { status: 403 });
  }

  if (!AIRTABLE_KEY) {
    console.error("submit-place: AIRTABLE_KEY not set");
    return json({ message: "AIRTABLE_KEY not configured" }, 500);
  }

  const submission = (await request.json()) as PlaceSubmission;

  if (
    !submission.name ||
    typeof submission.lat !== "number" ||
    typeof submission.lng !== "number"
  ) {
    return json({ message: "name, lat and lng are required" }, 400);
  }

  // Field names mirror the `places` content collection schema so the Airtable
  // row round-trips straight back onto the Places cards. `tip` is omitted when
  // empty so Airtable does not store a blank note.
  const fields: Record<string, unknown> = {
    address: submission.address ?? "",
    city: submission.city ?? "",
    lat: submission.lat,
    likedAt: new Date().toISOString(),
    lng: submission.lng,
    name: submission.name,
    placeId: submission.placeId ?? "",
    url: submission.url ?? "",
  };

  const tip = submission.tip?.trim();
  if (tip) {
    fields.tip = tip;
  }

  const airtableResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`,
    {
      // `typecast` lets Airtable coerce the ISO date string into a date field.
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
      headers: {
        authorization: `Bearer ${AIRTABLE_KEY}`,
        "content-type": "application/json",
      },
      method: "POST",
    },
  );

  const data = await airtableResponse.json();

  if (!airtableResponse.ok) {
    console.error("submit-place: Airtable error", JSON.stringify(data));
    return json({ detail: data, message: "Airtable request failed" }, 502);
  }

  // Trigger a Netlify build so the new place appears in the Places section.
  if (BUILD_HOOK_KEY) {
    await fetch(`https://api.netlify.com/build_hooks/${BUILD_HOOK_KEY}`, {
      method: "POST",
    });
  }

  return json(data, 200);
};
