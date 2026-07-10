import type { APIRoute } from "astro";
import { AIRTABLE_KEY, BUILD_HOOK_KEY } from "astro:env/server";

export const prerender = false;

const AIRTABLE_BASE_ID = "appT2NMQ7UD8T2smq";
const AIRTABLE_TABLE = "List";
const OWNER_EMAIL = "philgw@gmail.com";

type ReadingItem = {
  title: string;
  url: string;
  skipTweet: boolean;
  commentary: string;
};

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

// Verify the caller's Netlify Identity token by asking the site's own GoTrue
// endpoint who it belongs to. The Eleventy version relied on Netlify injecting
// `context.clientContext.user`; an Astro API route has to check the bearer
// token itself.
const getVerifiedEmail = async (authHeader: string, origin: string): Promise<string | null> => {
  try {
    const response = await fetch(`${origin}/.netlify/identity/user`, {
      headers: { authorization: authHeader },
    });
    if (!response.ok) {
      return null;
    }
    const user = (await response.json()) as { email?: string };
    return user.email ?? null;
  } catch {
    return null;
  }
};

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    console.error("No authentication details!");
    return new Response("", { status: 403 });
  }

  const { title, url, skipTweet, commentary } = (await request.json()) as ReadingItem;

  const email = await getVerifiedEmail(authHeader, new URL(request.url).origin);
  const itsMe = email === OWNER_EMAIL;

  if (!itsMe) {
    console.log("It wasn't me…");
    return json({ title, url, skipTweet, commentary }, 403);
  }

  if (!AIRTABLE_KEY) {
    console.error("AIRTABLE_KEY not set");
    return json({ message: "AIRTABLE_KEY not configured" }, 500);
  }

  const body = {
    records: [{ fields: { title, url, skipTweet, commentary } }],
  };

  console.log("going out: ", JSON.stringify(body, null, 2));

  const airtableResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${AIRTABLE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await airtableResponse.json();

  console.log("coming back: ", JSON.stringify(data));

  // Trigger a build so the new item appears in the reading list.
  if (BUILD_HOOK_KEY) {
    await fetch(`https://api.netlify.com/build_hooks/${BUILD_HOOK_KEY}`, {
      method: "POST",
    });
  }

  return json(data, 200);
};
