// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    preact({
      devtools: true,
    }),
  ],
  adapter: netlify(),
  env: {
    schema: {
      DEV_TO_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      GITHUB_PAT: envField.string({ context: "server", access: "secret", optional: true }),
      AIRTABLE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
