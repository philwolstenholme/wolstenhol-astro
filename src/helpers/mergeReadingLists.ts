import type { CollectionEntry } from "astro:content";

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

  const seen = new Set<string>();
  return [...devToItems, ...airtableItems]
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .filter(({ url }) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .map(({ date: _date, ...item }) => item);
}
