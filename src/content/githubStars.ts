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
  starred_at: z.string(),
});

type StarredItem = {
  starred_at: string;
  repo: {
    id: number;
    full_name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    created_at: string;
  };
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
        username: GITHUB_USERNAME,
        per_page: 100,
        headers: { accept: "application/vnd.github.star+json" },
      };

      const [page1, page2, page3] = await Promise.all([
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 1 }),
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 2 }),
        octokit.rest.activity.listReposStarredByUser({ ...starParams, page: 3 }),
      ]);

      const repos = [...page1.data, ...page2.data, ...page3.data] as unknown as StarredItem[];

      return repos.map((item) => ({
        id: String(item.repo.id),
        full_name: item.repo.full_name,
        html_url: item.repo.html_url,
        description: item.repo.description ? stripEmojis(item.repo.description) : null,
        stargazers_count: item.repo.stargazers_count,
        language: item.repo.language ?? null,
        created_at: item.repo.created_at,
        starred_at: item.starred_at,
      }));
    } catch (error) {
      console.error("GitHub stars fetch failed:", error);
      return [];
    }
  },
  schema: githubStarSchema,
});
