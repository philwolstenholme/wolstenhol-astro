import { defineCollection, z } from "astro:content";
import { AIRTABLE_KEY } from "astro:env/server";

const BASE_ID = "appT2NMQ7UD8T2smq";
const TABLE = "List";

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

      return data.records.map((record: any) => ({
        id: record.id,
        title: record.fields.title ?? "",
        url: record.fields.url ?? "",
        description: record.fields.subTitle ?? null,
        date: record.fields.date ?? record.createdTime ?? null,
      }));
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
