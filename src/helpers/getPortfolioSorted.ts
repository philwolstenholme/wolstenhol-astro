import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { sortBy } from "es-toolkit";

export const sortPortfolio = (
  entries: CollectionEntry<"portfolio">[],
): CollectionEntry<"portfolio">[] =>
  sortBy(entries, [(entry) => entry.data.weight ?? 0, (entry) => entry.data.name]);

export const getSortedPortfolio = async (): Promise<CollectionEntry<"portfolio">[]> =>
  sortPortfolio(await getCollection("portfolio"));
