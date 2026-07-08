# wolstenhol.me (Astro)

My personal site, rebuilt from a long-running [Eleventy site](https://github.com/philwolstenholme/wolstenhol-11ty) in [Astro](https://astro.build). This README documents the approach taken, the performance work done along the way, and anything else worth knowing if you're picking this codebase back up later.

## Stack

- **Astro 7**, server-rendered via the `@astrojs/netlify` adapter (`edgeMiddleware: true`), with individual pages opting back into static prerendering where possible.
- **Tailwind CSS 4** — CSS-first config (no `tailwind.config.js`), theme and custom variants defined directly in `src/styles/global.css`.
- **Alpine.js** for client-side interaction, lazy-loaded per-component via `async-alpine`.
- **HTMX** for partial page swaps (pagination, the contact form).
- **TypeScript**, **oxlint**/**oxfmt** for linting/formatting, **prettier** (`.astro` files only), enforced on commit via `simple-git-hooks` + `nano-staged`.

## Content

All external data (GitHub stars, Bluesky posts, Spotify listening history, dev.to posts/reading list, Airtable reading list, Foursquare places, Instagram, speaking history) is fetched through **Astro Content Collections** — see `src/content/*.ts`. Each collection has its own loader that hits the relevant API, normalises the response with a Zod schema, and (where relevant) falls back gracefully to an empty list when its API secret isn't configured, so the site still builds locally without every credential set. The `portfolio` and `speaking` collections load from local markdown/JSON instead of a remote API.

A few loaders do extra work worth knowing about:

- `spotify.ts` and `places.ts` use `es-toolkit`'s `sortBy`/`sampleSize`/`compact` to pick a varied, deduplicated sample from a larger API response.
- `bluesky.ts` hand-rolls a rich-text renderer that turns Bluesky's facet spans (links, mentions, tags) into HTML.
- `instagram.ts` scrapes Instagram directly and falls back to a committed `src/data/instagram-fallback.json` snapshot (refreshed via `npm run scrape:instagram`) when live scraping is blocked, which happens often on CI/Netlify IPs.
- `mergeReadingLists.ts` merges the dev.to and Airtable reading lists and de-duplicates by URL with `uniqBy`.

## Pagination without giving up caching

The homepage sections (GitHub stars, dev.to posts, reading list, speaking) are paginated, and the pagination needed to work with and without JavaScript while keeping the homepage cacheable at the CDN. The approach, copied from the 11ty site and adapted to Astro:

- `src/pages/index.astro` is a plain, prerendered homepage.
- `src/middleware.ts` rewrites requests for `/` to a server-rendered `index-dynamic.astro` whenever a pagination query param (`?githubStars=2` etc.) is present, or to a prerendered `index-mobile.astro` for mobile user agents — so the common case stays static while paginated/mobile requests get the right variant.
- `src/pages/partials/*.astro` are `prerender = false` HTMX endpoints that return just the next page of a section's markup, used for JS-enhanced pagination without a full page reload.
- `netlify.toml` sets a `Netlify-Vary` header on `/` so Netlify's edge CDN caches separate variants per pagination query param, mobile user agent, and the "hide WIP banner" cookie — giving effectively free, fine-grained ISR-style caching for every combination without extra infrastructure.

## Performance work

A handful of targeted changes, roughly in order of impact:

1. **`content-visibility: auto`** on off-screen homepage sections and portfolio cards, with `contain-intrinsic-size` kept in sync with real element dimensions via `IntersectionObserver`/`ResizeObserver` (`src/assets/content-visibility.ts`) so the browser can skip rendering work below the fold without introducing layout shift. Disabled entirely for `<noscript>` visitors.
2. **Self-hosted, subset fonts** with a metric-matched local fallback (`size-adjust` tuned against Times New Roman) to minimise CLS while the webfont loads, `font-display: swap`, and `<link rel="preload">` for the critical weight. Subsetting itself is handled at deploy time by `netlify-plugin-subfont`.
3. **CDN caching tuned per-route**: long `routeRules` max-age in `astro.config.mjs`, an explicit `Cache-Control` header from `Layout.astro`, and the `Netlify-Vary` cache-key partitioning described above so paginated/mobile variants don't thrash a shared cache entry.
4. **Same-origin image proxying** — Cloudinary, jsDelivr and Google's static-maps images are served through `/proxy/*` redirects in `netlify.toml` rather than as third-party requests, avoiding extra DNS/TLS handshakes.
5. **Speculation Rules API** — `Layout.astro` prerenders same-origin links eagerly (excluding anything marked `.no-prerender` or `rel=nofollow`).

## Dark mode

Theme is stored as `data-theme="dark" | "light"` on `<html>`, set by a small blocking inline script in `Layout.astro`'s `<head>` (before first paint, to avoid a flash of the wrong theme). It prefers an explicit `localStorage` choice over `prefers-color-scheme`, and re-applies on `pageshow`, `prerenderingchange` (for speculation-rules-prerendered pages) and cross-tab `storage` events. Tailwind's `dark:` variant is redefined via `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` to key off that attribute instead of the media query. `ThemeToggle.astro` flips the attribute and clears the stored override again if the new value matches the OS preference, so a visitor who hasn't made an explicit choice keeps following system changes.

## Modern CSS

Rather than reaching for JS, a few newer CSS features do real work in `src/styles/global.css`:

- A typed `@property --hue-angle` custom property drives a CSS-only hue-rotate animation.
- Native CSS masonry (`@supports (display: grid-lanes)`) lays out the Bluesky feed, falling back to a lazy-loaded `Colcade` script only where masonry isn't supported.
- `@custom-variant`s for `hocus`, `pointer-fine`, and a `slow-connection` variant that reads a live `--live-net-type` custom property to adapt to `navigator.connection`.
- Native CSS nesting throughout, `text-wrap: balance`/`pretty`, `scroll-timeline`/`animation-timeline` for a scroll-driven header nav indicator, and `::selection`/`::target-text` styling.

## Alpine components

Every component factory in `src/assets/alpine-*.ts` is wrapped in `defineComponent()` (`src/assets/alpine-define.ts`) purely so Alpine's magics (`$el`, `$refs`, `$watch`, etc.) type-check — it's an identity function at runtime. `alpine.ts` registers each component lazily through `async-alpine`, so a component's JS is only fetched once its `x-data`/`x-load` directive is actually reached. Notable ones:

- `alpine-spotify.ts` — the music player, including a scrolling browser-tab title while a preview plays (ported from the 11ty site's `scrolling-title.js`/`PwMusic.js`).
- `alpine-contact.ts` — client-side validation for the contact form ahead of an HTMX submit to Netlify Forms.
- `alpine-bluesky.ts` — masonry layout with the native/`Colcade` fallback described above.
- `alpine-header.ts` — tracks the active nav section via `IntersectionObserver` and hash changes.
- `alpine-party.ts` / `alpine-instagram.ts` — small bits of whimsy (press-and-hold confetti, hover lightbox).

## Housekeeping

- `scripts/scrape-instagram.mjs` refreshes the Instagram fallback JSON.
- `scripts/work-screenshots.mjs` generates portfolio screenshots for any entry not yet marked `happyWithScreenshot` in its frontmatter, to be uploaded to Cloudinary by hand.
- `scripts/foursquare-auth.mjs` is a one-off helper for obtaining a Foursquare OAuth token.
- `bruno/` holds a [Bruno](https://www.usebruno.com/) collection used for manually poking at the dev.to API during loader development — not part of CI.
- CI (`.github/workflows/lint.yml`) runs `format:check` and `lint` only; there's no automated test suite yet.
