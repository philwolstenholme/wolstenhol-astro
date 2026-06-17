import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { AIRTABLE_KEY } from "astro:env/server";
import metascraperFactory from "metascraper";
import metascraperDescription from "metascraper-description";

const BASE_ID = "appT2NMQ7UD8T2smq";
const TABLE = "List";

const metascraper = metascraperFactory([metascraperDescription()]);

async function getDescription(targetUrl: string): Promise<string | null> {
  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; wolstenhol-bot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const metadata = await metascraper({ html, url: res.url });
    return metadata.description ?? null;
  } catch {
    return null;
  }
}

export const airtableReadingList = defineCollection({
  loader: async () => {
    if (!AIRTABLE_KEY) {
      console.warn("Airtable reading list: AIRTABLE_KEY not set, skipping fetch");
      return [];
    }
    try {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?maxRecords=50&view=Grid%20view`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return await Promise.all(
        data.records.map(async (record: any) => {
          const url = record.fields.url ?? "";
          const description = record.fields.subTitle || (url ? await getDescription(url) : null);
          return {
            id: record.id,
            title: record.fields.title ?? "",
            url,
            description: description ?? null,
            date: record.fields.date ?? record.createdTime ?? null,
          };
        }),
      );
    } catch (error) {
      console.error("Airtable reading list fetch failed:", error);
      return [];
    }
  },
  schema: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    description: z.string().nullable(),
    date: z.string().nullable(),
  }),
});
