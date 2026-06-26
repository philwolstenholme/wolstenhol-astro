/**
 * Scrape recent Instagram posts for @philw_ and save them to
 * src/data/instagram-fallback.json so the content collection can use
 * them as a fallback when the live scraper is blocked (e.g. on CI).
 *
 * Usage: npm run scrape:instagram
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { InstagramScraper } from "@aduptive/instagram-scraper";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src/data/instagram-fallback.json");

const scraper = new InstagramScraper();
const results = await scraper.getPosts("philw_", 20);

if (!results.success || !results.posts || results.posts.length === 0) {
  console.error("Instagram scrape failed:", results.error ?? "no posts returned");
  process.exit(1);
}

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(results.posts, null, 2));
console.log(`Saved ${results.posts.length} posts to ${OUTPUT}`);
