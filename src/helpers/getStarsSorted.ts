import { getCollection } from "astro:content";

export const byStarredAtDesc = (a: { starred_at: string }, b: { starred_at: string }) =>
  b.starred_at.localeCompare(a.starred_at);

export const getSortedStars = async () => {
  const collection = await getCollection("github-stars");
  return collection.map((entry) => entry.data).sort(byStarredAtDesc);
};
