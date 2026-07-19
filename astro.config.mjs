import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, envField } from "astro/config";

import { subfont } from "./integrations/subfont.ts";

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
  alpine: ["alpinejs", "@alpinejs/csp", "@alpinejs/focus", "async-alpine"],
  audio: ["@web-kits/audio"],
  "es-toolkit": ["es-toolkit"],
  htmx: ["htmx.org"],
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
  adapter: netlify({ edgeMiddleware: true }),
  build: {
    // Astro's default "auto" inlines small component stylesheets straight
    // into the page instead of linking them, which the CSP's hash-based
    // style-src-elem can't reliably track (which components qualify depends
    // on their compiled CSS size, so it can flip as content changes). Force
    // every stylesheet external so 'self' alone covers style-src-elem.
    inlineStylesheets: "never",
  },
  cache: {
    provider: {
      entrypoint: "@astrojs/netlify/cache/provider",
    },
  },
  env: {
    schema: {
      AIRTABLE_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      BUILD_HOOK_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      DEV_TO_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      FOURSQUARE_OAUTH_TOKEN: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      GITHUB_PAT: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      GOOGLE_MAPS_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      GOOGLE_MAPS_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      SPOTIFY_CLIENT_ID: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      SPOTIFY_CLIENT_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      SPOTIFY_REFRESH_TOKEN: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
    },
  },
  integrations: [subfont()],
  routeRules: {
    "/**": { maxAge: 31536000 },
  },
  vite: {
    build: {
      // Vite's default 4kb threshold silently inlines small compiled script
      // chunks (and other small assets) straight into the page as literal
      // <script> text instead of a separate file — which a hash-based CSP
      // script-src can't reliably track, since whether a given component's
      // script "counts as small enough" can flip as its content changes.
      // Forcing every asset external keeps the CSP surface predictable.
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    plugins: [tailwindcss()],
  },
});
