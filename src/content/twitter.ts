import { Scraper } from "@the-convocation/twitter-scraper";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const TWITTER_USERNAME = "philw_";
const MAX_TWEETS = 50;

export const twitter = defineCollection({
  loader: async () => {
    try {
      console.log(`Twitter: creating scraper for @${TWITTER_USERNAME}`);
      const scraper = new Scraper();

      console.log(`Twitter: checking if logged in (guest mode)`);
      const isLoggedIn = await scraper.isLoggedIn();
      console.log(`Twitter: isLoggedIn=${isLoggedIn}`);

      console.log(`Twitter: starting getTweets() generator`);
      const tweets = [];
      let rawCount = 0;
      let skippedCount = 0;

      for await (const tweet of scraper.getTweets(TWITTER_USERNAME, MAX_TWEETS)) {
        rawCount++;
        console.log(
          `Twitter: raw tweet #${rawCount} id=${tweet.id} isRetweet=${tweet.isRetweet} text=${(tweet.text ?? "").slice(0, 60)}`,
        );

        if (!tweet.id || tweet.isRetweet) {
          skippedCount++;
          console.log(`Twitter: skipping tweet #${rawCount} (no id or retweet)`);
          continue;
        }

        const photos = (tweet.photos ?? []).map((p) => ({
          url: p.url,
          alt: p.alt_text ?? "",
        }));

        tweets.push({
          id: tweet.id,
          created_at: tweet.timeParsed?.toISOString() ?? new Date().toISOString(),
          content: tweet.html ?? tweet.text ?? "",
          url: tweet.permanentUrl ?? `https://twitter.com/${TWITTER_USERNAME}/status/${tweet.id}`,
          username: tweet.username ?? TWITTER_USERNAME,
          name: tweet.name ?? TWITTER_USERNAME,
          photos,
          likeCount: tweet.likes ?? 0,
          retweetCount: tweet.retweets ?? 0,
          replyCount: tweet.replies ?? 0,
        });
      }

      console.log(
        `Twitter: done — ${tweets.length} kept, ${skippedCount} skipped out of ${rawCount} raw`,
      );
      return tweets;
    } catch (error) {
      console.error("Twitter: fetch failed", error);
      return [];
    }
  },
  schema: z.object({
    created_at: z.string(),
    content: z.string(),
    url: z.string(),
    username: z.string(),
    name: z.string(),
    photos: z.array(
      z.object({
        url: z.string(),
        alt: z.string(),
      }),
    ),
    likeCount: z.number(),
    retweetCount: z.number(),
    replyCount: z.number(),
  }),
});
