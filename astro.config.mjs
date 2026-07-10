import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, envField } from "astro/config";

// Third-party client dependencies split into their own long-lived chunks, so a
// Renovate bump to one library only cache-busts that library's chunk — never my
// entry scripts (which hold just my own glue code) or the other vendors.
//
// Grouping mirrors how each package is *versioned and updated* (see the repo's
// Renovate PRs) rather than what it does:
//   - `alpine`: alpinejs + its plugins are released as one ecosystem and bumped
//     together, so co-locating them means one re-download per Alpine update
//     instead of three separate ones.
//   - `htmx`: large (~60kB) and very rarely updated, so it is isolated to stay
//     cached across the many deploys that never touch it.
//   - the small, faster-moving libs (`es-toolkit`, `@web-kits/audio`,
//     `prop-for-that`) each get their own chunk so their frequent bumps never
//     invalidate anything else.
const clientVendorChunks = {
  alpine: ["alpinejs", "@alpinejs/focus", "async-alpine"],
  htmx: ["htmx.org"],
  "es-toolkit": ["es-toolkit"],
  audio: ["@web-kits/audio"],
  "prop-for-that": ["prop-for-that"],
};

/** @type {(id: string) => string | undefined} */
const manualChunks = (id) => {
  if (!id.includes("node_modules")) {
    return undefined;
  }
  for (const [chunk, packages] of Object.entries(clientVendorChunks)) {
    if (packages.some((pkg) => id.includes(`node_modules/${pkg}/`))) {
      return chunk;
    }
  }
  return undefined;
};

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  },
  integrations: [],
  adapter: netlify({ edgeMiddleware: true }),
  cache: {
    provider: {
      entrypoint: "@astrojs/netlify/cache/provider",
    },
  },
  routeRules: {
    "/**": { maxAge: 31536000 },
  },
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
      BUILD_HOOK_KEY: envField.string({
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
