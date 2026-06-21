import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { GITHUB_PAT } from "astro:env/server";
import emojiRegex from "emoji-regex";
import { Octokit } from "octokit";

const stripEmojis = (str: string) => str.replace(emojiRegex(), "").replace(/\s+/g, " ").trim();

const GITHUB_USERNAME = "philwolstenholme";

const githubStarSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
  created_at: z.string(),
});

export const githubStars = defineCollection({
  loader: async () => {
    if (!GITHUB_PAT) {
      console.warn("GitHub stars: GITHUB_PAT not set, skipping fetch");
      return [];
    }
    try {
      const octokit = new Octokit({
        auth: GITHUB_PAT,
      });

      const { data } = await octokit.rest.activity.listReposStarredByUser({
        username: GITHUB_USERNAME,
        per_page: 100,
      });

      const repos = data as Extract<(typeof data)[number], { id: number }>[];

      return repos.map((repo) => ({
        id: String(repo.id),
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description ? stripEmojis(repo.description) : null,
        stargazers_count: repo.stargazers_count,
        language: repo.language ?? null,
        created_at: repo.created_at,
      }));
    } catch (error) {
      console.error("GitHub stars fetch failed:", error);
      return [];
    }
  },
  schema: githubStarSchema,
});
