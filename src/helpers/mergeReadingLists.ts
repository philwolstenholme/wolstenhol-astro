import type { CollectionEntry } from "astro:content";
import { sortBy, uniqBy } from "es-toolkit";

export interface ReadingListCardItem {
  url: string;
  canonical_url: string;
  title: string;
  description: string | null;
}

type WithDate = ReadingListCardItem & { date: string | null };

export function mergeReadingLists(
  devToEntries: CollectionEntry<"dev-to-reading-list">[],
  airtableEntries: CollectionEntry<"airtable-reading-list">[],
): ReadingListCardItem[] {
  const devToItems: WithDate[] = devToEntries.map((entry) => ({
    url: entry.data.article.url,
    canonical_url: entry.data.article.canonical_url,
    title: entry.data.article.title,
    description: entry.data.article.description,
    date: entry.data.created_at,
  }));

  const airtableItems: WithDate[] = airtableEntries.map((entry) => ({
    url: entry.data.url,
    canonical_url: entry.data.url,
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
  }));

  const sorted = sortBy([...devToItems, ...airtableItems], [(item) => item.date ?? ""]).reverse();
  return uniqBy(sorted, ({ url }) => url).map(({ date: _date, ...item }) => item);
}
