import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

const byStarredAtDesc = (a: { starred_at: string }, b: { starred_at: string }) =>
  b.starred_at.localeCompare(a.starred_at);

export const sortStars = (collection: CollectionEntry<"github-stars">[]) =>
  collection.map((entry) => entry.data).sort(byStarredAtDesc);

export const getSortedStars = async () => sortStars(await getCollection("github-stars"));
