import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { sortBy } from "es-toolkit";

const escapeMap: Record<string, string> = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;",
};

const escapeHTML = (str: string) =>
  str?.replace(/[&<>"']/g, (match) => escapeMap[match] ?? match) ?? "";

const nl2br = (str: string) => str?.replaceAll("\n", "<br />\n") ?? "";

interface BskyFacet {
  features: Array<{
    $type: string;
    did?: string;
    tag?: string;
    uri?: string;
  }>;
  index: { byteEnd: number; byteStart: number };
}

interface BskyFeedEntry {
  post: BskyPost;
  reason?: {
    $type?: string;
    by?: {
      avatar?: string;
      displayName?: string;
      handle: string;
    };
  };
}

interface BskyPost {
  author: {
    avatar?: string;
    displayName?: string;
    handle: string;
  };
  createdAt?: string;
  embed?: {
    external?: {
      description?: string;
      thumb?: string;
      title?: string;
      uri: string;
    };
    images?: Array<{
      alt?: string;
      fullsize: string;
      thumb: string;
    }>;
  };
  indexedAt?: string;
  likeCount?: number;
  record?: {
    facets?: BskyFacet[];
    text?: string;
  };
  repostCount?: number;
  uri: string;
}

function renderPostContent(post: BskyPost): string {
  const text = post.record?.text ?? "";
  let html = "";
  let lastIndex = 0;

  const facets = sortBy(post.record?.facets ?? [], [(facet) => facet.index.byteStart]);

  for (const facet of facets) {
    const start = facet.index.byteStart;
    const end = facet.index.byteEnd;
    const feature = facet.features[0];

    html += nl2br(escapeHTML(text.slice(lastIndex, start)));

    const facetText = text.slice(start, end);
    if (feature.$type === "app.bsky.richtext.facet#link") {
      html += `<a href="${escapeHTML(feature.uri ?? "")}">${escapeHTML(facetText)}</a>`;
    } else if (feature.$type === "app.bsky.richtext.facet#mention") {
      html += `<a href="https://bsky.app/profile/${escapeHTML(feature.did ?? "")}">${escapeHTML(facetText)}</a>`;
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

const schema = z.object({
  account: z.object({
    acct: z.string(),
    avatar: z.string(),
    display_name: z.string(),
  }),
  card: z
    .object({
      description: z.string(),
      image: z.string(),
      title: z.string(),
      url: z.string(),
    })
    .nullable(),
  content: z.string(),
  created_at: z.string(),
  likeCount: z.number(),
  media_attachments: z.array(
    z.object({
      alt: z.string().optional(),
      preview_url: z.string(),
      type: z.string(),
      url: z.string(),
    }),
  ),
  reblog: z
    .object({
      account: z.object({
        acct: z.string(),
        avatar: z.string(),
        display_name: z.string(),
      }),
    })
    .nullable(),
  repostCount: z.number(),
  url: z.string(),
});

function transformEntry(entry: BskyFeedEntry): z.infer<typeof schema> & { id: string } {
  const { post } = entry;

  const transformed: z.infer<typeof schema> & { id: string } = {
    account: {
      acct: post.author.handle,
      avatar: post.author.avatar ?? "",
      display_name: post.author.displayName ?? post.author.handle,
    },
    card: null,
    content: renderPostContent(post),
    created_at: post.indexedAt ?? post.createdAt ?? new Date().toISOString(),
    id: post.uri,
    likeCount: post.likeCount ?? 0,
    media_attachments: [],
    reblog: null,
    repostCount: post.repostCount ?? 0,
    url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
  };

  if (entry.reason?.by) {
    transformed.reblog = {
      account: {
        acct: entry.reason.by.handle,
        avatar: entry.reason.by.avatar ?? "",
        display_name: entry.reason.by.displayName ?? entry.reason.by.handle,
      },
    };
  }

  if (post.embed?.images) {
    transformed.media_attachments = post.embed.images.map((img) => ({
      alt: img.alt ?? "",
      preview_url: img.thumb,
      type: "image",
      url: img.fullsize,
    }));
  } else if (post.embed?.external) {
    transformed.card = {
      description: post.embed.external.description ?? "",
      image: post.embed.external.thumb ?? "",
      title: post.embed.external.title ?? "",
      url: post.embed.external.uri,
    };
  }

  return transformed;
}

export const bluesky = defineCollection({
  loader: async () => {
    try {
      const response = await fetch(
        "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=wolstenhol.me&filter=posts_no_replies&limit=50",
      );

      if (!response.ok) {
        console.error("Bluesky: API request failed", response.status);
        return [];
      }

      const data = (await response.json()) as { feed?: BskyFeedEntry[] };

      if (!data?.feed) {
        console.error("Bluesky: invalid response", data);
        return [];
      }

      const posts = data.feed.map(transformEntry);
      console.log(`Bluesky: ${posts.length} posts fetched`);
      return posts;
    } catch (error) {
      console.error("Bluesky: fetch failed", error);
      return [];
    }
  },
  schema,
});
