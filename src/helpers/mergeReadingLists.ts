import type { CollectionEntry } from "astro:content";
import { sortBy, uniqBy } from "es-toolkit";

export interface ReadingListCardItem {
  canonical_url: string;
  description: null | string;
  title: string;
  url: string;
}

type WithDate = ReadingListCardItem & { date: null | string };

export function mergeReadingLists(
  devToEntries: CollectionEntry<"dev-to-reading-list">[],
  airtableEntries: CollectionEntry<"airtable-reading-list">[],
): ReadingListCardItem[] {
  const devToItems: WithDate[] = devToEntries.map((entry) => ({
    canonical_url: entry.data.article.canonical_url,
    date: entry.data.created_at,
    description: entry.data.article.description,
    title: entry.data.article.title,
    url: entry.data.article.url,
  }));

  const airtableItems: WithDate[] = airtableEntries.map((entry) => ({
    canonical_url: entry.data.url,
    date: entry.data.date,
    description: entry.data.description,
    title: entry.data.title,
    url: entry.data.url,
  }));

  const sorted = sortBy([...devToItems, ...airtableItems], [(item) => item.date ?? ""]).reverse();
  return uniqBy(sorted, ({ url }) => url).map(({ date: _date, ...item }) => item);
}
