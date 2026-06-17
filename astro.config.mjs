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
      DEV_TO_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GITHUB_PAT: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      AIRTABLE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GOOGLE_MAPS_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GOOGLE_MAPS_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      FOURSQUARE_OAUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SPOTIFY_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SPOTIFY_CLIENT_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SPOTIFY_REFRESH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
