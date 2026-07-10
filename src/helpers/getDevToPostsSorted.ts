import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { sortBy } from "es-toolkit";

export const sortDevToPosts = (collection: CollectionEntry<"dev-to-posts">[]) =>
  sortBy(collection, [(entry) => entry.data.published_at ?? ""])
    .reverse()
    .map((entry) => entry.data);

export const getSortedDevToPosts = async () => sortDevToPosts(await getCollection("dev-to-posts"));
