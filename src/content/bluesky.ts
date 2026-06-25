import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHTML = (str: string): string =>
  str?.replace(/[&<>"']/g, (match) => escapeMap[match] || match) ?? "";

const nl2br = (str: string): string => str?.replaceAll("\n", "<br />\n") ?? "";

function renderPostContent(post: any): string {
  const text: string = post.record?.text || "";
  let html = "";
  let lastIndex = 0;

  const facets = [...(post.record?.facets || [])].sort(
    (a: any, b: any) => a.index.byteStart - b.index.byteStart,
  );

  for (const facet of facets) {
    const start = facet.index.byteStart;
    const end = facet.index.byteEnd;
    const feature = facet.features[0];

    html += nl2br(escapeHTML(text.slice(lastIndex, start)));

    const facetText = text.slice(start, end);
    if (feature.$type === "app.bsky.richtext.facet#link") {
      html += `<a href="${escapeHTML(feature.uri)}">${escapeHTML(facetText)}</a>`;
    } else if (feature.$type === "app.bsky.richtext.facet#mention") {
      html += `<a href="https://bsky.app/profile/${escapeHTML(feature.did)}">${escapeHTML(facetText)}</a>`;
    } else if (feature.$type === "app.bsky.richtext.facet#tag") {
      html += `<a href="https://bsky.app/hashtag/${escapeHTML(facetText.slice(1))}">${escapeHTML(facetText)}</a>`;
    } else {
      html += nl2br(escapeHTML(facetText));
    }

    lastIndex = end;
  }

  html += nl2br(escapeHTML(text.slice(lastIndex)));

  return html;
}

function transformEntry(entry: any) {
  const post = entry.post;

  const result: any = {
    id: post.uri.split("/").pop() as string,
    created_at: (post.indexedAt || post.record?.createdAt || "") as string,
    content: renderPostContent(post),
    url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
    account: {
      acct: post.author.handle as string,
      display_name: (post.author.displayName || post.author.handle) as string,
      avatar: (post.author.avatar || null) as string | null,
    },
    media_attachments: [] as any[],
    card: null as any,
    reblog: null as any,
  };

  if (entry.reason?.by) {
    result.reblog = {
      account: {
        acct: entry.reason.by.handle as string,
        display_name: (entry.reason.by.displayName || entry.reason.by.handle) as string,
        avatar: (entry.reason.by.avatar || null) as string | null,
      },
    };
  }

  const embed = post.embed;
  if (embed) {
    if (embed.images) {
      result.media_attachments = embed.images.map((img: any) => ({
        type: "image",
        url: img.fullsize as string,
        preview_url: (img.thumb || img.fullsize) as string,
        description: (img.alt || "") as string,
      }));
    } else if (embed.external) {
      result.card = {
        url: embed.external.uri as string,
        title: (embed.external.title || "") as string,
        description: (embed.external.description || "") as string,
        image: (embed.external.thumb || null) as string | null,
      };
    }
  }

  return result;
}

export const bluesky = defineCollection({
  loader: async () => {
    try {
      const response = await fetch(
        "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=wolstenhol.me&filter=posts_no_replies&limit=50",
      );

      if (!response.ok) {
        console.error(`Bluesky: API returned ${response.status}`);
        return [];
      }

      const data = await response.json();

      if (!data?.feed) {
        console.error("Bluesky: unexpected API response", data);
        return [];
      }

      const posts = data.feed.map(transformEntry);
      console.log(`Bluesky: ${posts.length} posts fetched`);
      return posts;
    } catch (error) {
      console.error("Bluesky: failed to fetch posts", error);
      return [];
    }
  },
  schema: z.object({
    created_at: z.string(),
    content: z.string(),
    url: z.string(),
    account: z.object({
      acct: z.string(),
      display_name: z.string(),
      avatar: z.string().nullable(),
    }),
    reblog: z
      .object({
        account: z.object({
          acct: z.string(),
          display_name: z.string(),
          avatar: z.string().nullable(),
        }),
      })
      .nullable(),
    media_attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
        preview_url: z.string(),
        description: z.string(),
      }),
    ),
    card: z
      .object({
        url: z.string(),
        title: z.string(),
        description: z.string(),
        image: z.string().nullable(),
      })
      .nullable(),
  }),
});
