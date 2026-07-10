import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { sortBy } from "es-toolkit";

export const sortSpeaking = (collection: CollectionEntry<"speaking">[]) =>
  sortBy(collection, [(entry) => parseInt(entry.id, 10)]).map((entry) => entry.data);

export const getSortedSpeaking = async () => sortSpeaking(await getCollection("speaking"));
