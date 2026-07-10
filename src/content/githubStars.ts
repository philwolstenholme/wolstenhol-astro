import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { GITHUB_PAT } from "astro:env/server";
import emojiRegex from "emoji-regex";
import { Octokit } from "octokit";

const stripEmojis = (str: string) => str.replace(emojiRegex(), "").replace(/\s+/g, " ").trim();

const GITHUB_USERNAME = "philwolstenholme";

const githubStarSchema = z.object({
  created_at: z.string(),
  description: z.string().nullable(),
  full_name: z.string(),
  html_url: z.string(),
  id: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  starred_at: z.string(),
});

type StarredItem = {
  repo: {
    created_at: string;
    description: null | string;
    full_name: string;
    html_url: string;
    id: number;
    language: null | string;
    stargazers_count: number;
  };
  starred_at: string;
};

export const githubStars = defineCollection({
  loader: async () => {
    if (!GITHUB_PAT) {
      console.warn("GitHub stars: GITHUB_PAT not set, skipping fetch");
      return [];
    }
    try {
      const octokit = new Octokit({ auth: GITHUB_PAT });

      const starParams = {
        headers: { accept: "application/vnd.github.star+json" },
        per_page: 100,
        username: GITHUB_USERNAME,
      };

      const [page1, page2, page3] = await Promise.all([
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 1 }),
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 2 }),
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 3 }),
      ]);

      const repos = [...page1.data, ...page2.data, ...page3.data] as unknown as StarredItem[];

      return repos.map((item) => ({
        created_at: item.repo.created_at,
        description: item.repo.description ? stripEmojis(item.repo.description) : null,
        full_name: item.repo.full_name,
        html_url: item.repo.html_url,
        id: String(item.repo.id),
        language: item.repo.language ?? null,
        stargazers_count: item.repo.stargazers_count,
        starred_at: item.starred_at,
      }));
    } catch (error) {
      console.error("GitHub stars fetch failed:", error);
      return [];
    }
  },
  schema: githubStarSchema,
});
