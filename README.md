# wolstenhol.me

My personal site, rebuilt in [Astro](https://astro.build) after several years
as an [Eleventy](https://github.com/philwolstenholme/wolstenhol-11ty) site.
This README summarises how the rebuild was approached, the performance work
done along the way, and a few of the more interesting details.

## Stack

- **Astro 7** with the Netlify adapter (`@astrojs/netlify`, edge middleware
  enabled) and Astro's built-in cache provider.
- **Tailwind CSS 4** via `@tailwindcss/vite` (no PostCSS config needed).
- **Alpine.js** for client-side interactivity, lazy-loaded per-component via
  [Async Alpine](https://github.com/lukeworth/async-alpine).
- **HTMX** for server-driven interactions (pagination, the contact form).
- **TypeScript** everywhere, in strict mode.
- **oxlint** + **oxfmt** for linting/formatting JS/TS (and CSS/JSON), with
  **Prettier** reserved for `.astro` files, wired up as pre-commit hooks via
  `simple-git-hooks` + `nano-staged`.

## Content collections

All external and local data flows through Astro content collections
(`src/content.config.ts`), each with its own loader and schema in
`src/content/*.ts`: GitHub stars, DEV.to posts and reading list, an Airtable
reading list, Bluesky posts, speaking engagements, liked places (Foursquare +
Google Maps), a portfolio of work (local markdown, via the built-in `glob()`
loader), currently-playing/top Spotify data, and Instagram posts.

Astro's `astro:env` schema (`astro.config.mjs`) declares every third-party
secret as an optional server-only string, so a build never fails just because
a given integration's API key isn't configured — the affected loader simply
warns and returns an empty collection.

## Device-aware rendering

`src/middleware.ts` runs at the edge and rewrites the homepage request based
on the incoming device and query params, without changing the visible URL:

- Mobile user agents (detected via the `Sec-CH-UA-Mobile` client hint, with a
  `ua-parser-js` fallback) are rewritten to a prerendered `/index-mobile`.
- Requests carrying pagination query params (e.g. `?githubStars=2`) are
  rewritten to `/index-dynamic`, which is server-rendered instead of static.

This means most visitors get a fully static, prerendered homepage, while only
the visitors who actually need paginated or mobile-specific markup pay for
SSR or a different bundle.

## Alpine + HTMX

Every interactive island lives in its own `src/assets/alpine-*.ts` file,
wrapped in a `defineComponent()` helper (`src/assets/alpine-define.ts`) that's
just a typed identity function — it exists purely so each component gets
correct `Alpine.AlpineComponent<T>` typing for `$el`, `$refs`, `$watch`, etc.
Components are registered with `Alpine.asyncData()` and opt into lazy
hydration in markup with `x-load="idle"`, so their JS only loads once the
browser is idle rather than blocking the initial render.

HTMX handles pagination (`hx-get`/`hx-swap` on the "load more" style buttons,
with matching HTMX partial endpoints under `src/pages/partials/`) and the
contact form (`hx-post` on submit, validated client-side with Alpine first).
A small custom HTMX `preload` extension (`src/assets/htmx.ts`) prefetches the
next page on hover/mousedown so pagination feels instant.

## Performance work

A handful of targeted changes made the biggest difference:

1. **`content-visibility: auto` on off-screen sections and cards**, paired
   with a small `IntersectionObserver` + `ResizeObserver` script
   (`src/assets/content-visibility.ts`) that measures each section once
   rendered and writes an accurate `contain-intrinsic-size`, so the browser
   can skip layout/paint work for anything not yet on screen without the
   page jumping around once it scrolls into view. Degrades cleanly via a
   `<noscript>` fallback.
2. **Font loading**: only the font weights actually used are preloaded
   (`rel="preload" as="font"`), `font-display: swap` is set on every
   `@font-face`, and a size-adjusted local fallback face reduces the layout
   shift when the real font swaps in.
3. **Lazy-loaded interactivity**: Alpine components load on browser idle
   (`x-load="idle"`) instead of eagerly, and the Speculation Rules API
   (`<script type="speculationrules">` in `Layout.astro`) prerenders
   same-origin links a visitor is likely to click next.

On top of that: images are loaded with explicit `width`/`height`,
`loading`/`decoding`/`fetchpriority` set deliberately rather than left to
defaults, and route-level caching is configured through `routeRules` in
`astro.config.mjs` plus explicit `Cache-Control` headers on HTMX partial
responses.

## Modern CSS

The stylesheet (`src/styles/global.css`) leans on newer CSS rather than
JavaScript wherever possible:

- Tailwind 4 `@custom-variant`s for dark mode, hover-capable pointers, and a
  "slow connection" container style query.
- Native CSS nesting throughout, plus `@layer` for base/utility ordering.
- A typed custom property (`@property --hue-angle`) driving an animated
  `hue-rotate()` filter.
- `scroll-timeline`/`animation-timeline` for a scroll-driven header
  indicator, with no JS scroll listener involved.
- Native CSS masonry (`display: grid-lanes`) for the Bluesky feed, falling
  back to a small JS masonry layout where unsupported.
- `text-wrap: balance` / `text-wrap: pretty`, standard `line-clamp` alongside
  the legacy `-webkit-line-clamp`, and CSS subgrid for card layouts.

## Dark mode

Theme state is a `data-theme` attribute on `<html>`, decided by an inline,
render-blocking script in `<head>` (to avoid a flash of the wrong theme):
`prefers-color-scheme` is the source of truth unless a `localStorage`
override exists. The toggle button (`ThemeToggle.astro`) only writes an
override when the chosen theme *differs* from the OS preference, and removes
it otherwise — so a visitor who briefly overrides the theme then changes
their OS setting back to match isn't left stuck on a stale explicit choice.
The theme also re-syncs on `pageshow` (bfcache), `prerenderingchange`
(speculation rules), and the cross-tab `storage` event.

## Scrapbook details

The site's visual language leans into a hand-made "scrapbook" feel rather
than a clean corporate one:

- A `GrungeOverlay` component overlays a randomised-opacity grunge texture on
  cards, so no two cards look quite the same — subtler on imagery that needs
  to stay legible (portfolio screenshots, map tiles), stronger elsewhere.
- The Spotify card's colour gradient gets an SVG `feTurbulence` grain filter
  blended on top, again with a randomised opacity per card.
- When a Spotify preview is playing, the browser tab title scrolls like an
  old-school marquee (`src/helpers/scrollingTitle.ts`), ported from the
  Eleventy site's approach, and respects `prefers-reduced-motion`.
- Hand-drawn squiggle underlines, randomly-rotated washi-tape strips on
  reading-list cards, a themed 404 page, and a confetti easter egg on the
  homepage avatar round out the theme.

## Data sources

Spotify (top artists/genres via the Web API refresh-token flow), GitHub
(starred repos via Octokit), Instagram (scraped via
`@aduptive/instagram-scraper`, with an offline-generated JSON fallback for
when the scraper is blocked in CI), Bluesky (public AT Protocol
`getAuthorFeed` endpoint, with a hand-rolled rich-text facet renderer),
DEV.to (posts + reading list via their REST API), Airtable (a second reading
list, falling back to scraping `<meta description>` when Airtable itself has
none), and Foursquare + signed Google Static Maps URLs for a "liked places"
map.

## Development

```bash
npm install
npm run dev       # astro dev
npm run build     # astro build
npm run lint      # oxlint src/
npm run format    # oxfmt + prettier (for .astro files)
```
