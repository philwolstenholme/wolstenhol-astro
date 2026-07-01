import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { sortBy } from "es-toolkit";

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHTML = (str: string) =>
  str?.replace(/[&<>"']/g, (match) => escapeMap[match] ?? match) ?? "";

const nl2br = (str: string) => str?.replaceAll("\n", "<br />\n") ?? "";

interface BskyFacet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
    tag?: string;
  }>;
}

interface BskyPost {
  record?: {
    text?: string;
    facets?: BskyFacet[];
  };
  uri: string;
  indexedAt?: string;
  createdAt?: string;
  author: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  embed?: {
    images?: Array<{
      fullsize: string;
      thumb: string;
      alt?: string;
    }>;
    external?: {
      uri: string;
      title?: string;
      description?: string;
      thumb?: string;
    };
  };
  repostCount?: number;
  likeCount?: number;
}

interface BskyFeedEntry {
  post: BskyPost;
  reason?: {
    $type?: string;
    by?: {
      handle: string;
      displayName?: string;
      avatar?: string;
    };
  };
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

function transformEntry(entry: BskyFeedEntry) {
  const { post } = entry;

  const transformed: {
    id: string;
    created_at: string;
    content: string;
    url: string;
    account: {
      acct: string;
      display_name: string;
      avatar: string;
    };
    media_attachments: Array<{
      type: string;
      url: string;
      preview_url: string;
      alt?: string;
    }>;
    card: {
      url: string;
      title: string;
      description: string;
      image: string;
    } | null;
    repostCount: number;
    likeCount: number;
    reblog: {
      account: {
        acct: string;
        display_name: string;
        avatar: string;
      };
    } | null;
  } = {
    id: post.uri,
    created_at: post.indexedAt ?? post.createdAt ?? new Date().toISOString(),
    content: renderPostContent(post),
    url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
    account: {
      acct: post.author.handle,
      display_name: post.author.displayName ?? post.author.handle,
      avatar: post.author.avatar ?? "",
    },
    media_attachments: [],
    card: null,
    repostCount: post.repostCount ?? 0,
    likeCount: post.likeCount ?? 0,
    reblog: null,
  };

  if (entry.reason?.by) {
    transformed.reblog = {
      account: {
        acct: entry.reason.by.handle,
        display_name: entry.reason.by.displayName ?? entry.reason.by.handle,
        avatar: entry.reason.by.avatar ?? "",
      },
    };
  }

  if (post.embed?.images) {
    transformed.media_attachments = post.embed.images.map((img) => ({
      type: "image",
      url: img.fullsize,
      preview_url: img.thumb,
      alt: img.alt ?? "",
    }));
  } else if (post.embed?.external) {
    transformed.card = {
      url: post.embed.external.uri,
      title: post.embed.external.title ?? "",
      description: post.embed.external.description ?? "",
      image: post.embed.external.thumb ?? "",
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
  schema: z.object({
    created_at: z.string(),
    content: z.string(),
    url: z.string(),
    account: z.object({
      acct: z.string(),
      display_name: z.string(),
      avatar: z.string(),
    }),
    media_attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
        preview_url: z.string(),
        alt: z.string().optional(),
      }),
    ),
    card: z
      .object({
        url: z.string(),
        title: z.string(),
        description: z.string(),
        image: z.string(),
      })
      .nullable(),
    repostCount: z.number(),
    likeCount: z.number(),
    reblog: z
      .object({
        account: z.object({
          acct: z.string(),
          display_name: z.string(),
          avatar: z.string(),
        }),
      })
      .nullable(),
  }),
});
