# wolstenhol.me

My personal site, rebuilt in [Astro](https://astro.build) from a previous
[Eleventy version](https://github.com/philwolstenholme/wolstenhol-11ty). This
README summarises how the site is put together, what performance work went
into it, and a few of the more interesting implementation details.

## Stack

The footer calls it the **"AHA Stack"**: **A**stro, **H**TMX, **A**lpine.js,
plus Tailwind CSS v4 for styling. Astro components are plain `.astro` files
with all logic kept in the frontmatter script — no React/JSX is used anywhere
in the project, even though components that hydrate on the client still get
their interactivity from Alpine rather than a component framework.

- **Astro 7** with the `@astrojs/netlify` adapter
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Alpine.js** (+ `async-alpine`, `@alpinejs/focus`) for client-side state
- **HTMX** for partial page updates (pagination, the contact form)
- **oxlint** / **oxfmt** / **prettier** for linting and formatting, enforced
  via `simple-git-hooks` + `nano-staged` on commit and in CI

## Architecture

The homepage is rendered three different ways from the same
`HomePageContent.astro`:

- `/` — statically prerendered (`prerender = true`), served to desktop
  visitors.
- `/index-mobile` — also statically prerendered, but built with a smaller
  "items per page" count tuned for mobile.
- `/index-dynamic` — server-rendered (`prerender = false`), used only when a
  pagination query string is present so the no-JS, URL-based pagination keeps
  working without needing a fully dynamic homepage for every visitor.

`src/middleware.ts` decides which variant a request actually gets: it detects
mobile user agents (UA-Client-Hints with a `ua-parser-js` fallback) and
rewrites to `/index-mobile`, or rewrites to `/index-dynamic` whenever a
pagination param (`githubStars`, `posts`, `readingList`, `speaking`) is
present.

On top of that, `astro.config.mjs` configures Astro's Netlify cache provider
(`cache.provider` + `routeRules`) so cache-hinted responses are stored
durably across Netlify's function instances — Netlify's ["advanced caching
and ISR with
Astro"](https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro)
pattern. `netlify.toml` complements this with a `Netlify-Vary` header on `/`
so the CDN caches separate variants per pagination query, mobile hint, and
banner-dismissal cookie, plus asset proxy redirects (`/proxy/cloudinary`,
`/proxy/gstatic`, etc.) so third-party images can be cached and optimised as
if they were first-party.

## Content collections

All content is defined as Astro Content Collections in `src/content.config.ts`,
with each collection's schema and loader living together under
`src/content/`:

| Collection                             | Source                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `github-stars`                         | GitHub REST API (starred repos)                                                                                                       |
| `dev-to-posts` / `dev-to-reading-list` | dev.to API                                                                                                                            |
| `airtable-reading-list`                | Airtable, backfilled with `metascraper` when a link has no description                                                                |
| `bluesky`                              | Bluesky's public AppView API, with hand-rolled rich-text rendering from post facets                                                   |
| `speaking`                             | Local JSON                                                                                                                            |
| `places`                               | Foursquare API, plus signed Google Static Maps URLs                                                                                   |
| `portfolio`                            | Local Markdown files                                                                                                                  |
| `spotify`                              | Spotify Web API (top artists/tracks via a refresh-token flow)                                                                         |
| `instagram`                            | `@aduptive/instagram-scraper`, falling back to a pre-scraped JSON snapshot (`npm run scrape:instagram`) if the live scrape is blocked |

Every loader wraps its fetch in a try/catch and returns an empty array on
missing credentials or upstream failures, so a missing API key degrades a
homepage section instead of failing the build.

## Client-side interactivity

**Alpine** components live in `src/assets/alpine-*.ts`, each registered
lazily through `async-alpine` (`x-load="idle"`) and wrapped in the
`defineComponent()` helper from `alpine-define.ts` so Alpine magics (`$el`,
`$refs`, `$watch`) are typed. They cover things like scroll-spy navigation
highlighting, the horizontal scroller controls, Spotify playback + a
scrolling browser-tab title when a preview is playing (ported from the 11ty
site's `scrolling-title.js`), Bluesky masonry layout, and contact form
validation.

**HTMX** drives:

- Pagination partials (`src/pages/partials/*.astro`) — server-rendered
  fragments loaded via `hx-get`, with a custom preload extension that
  prefetches them on hover/mousedown/touchstart, and an `HX-Replace-Url`
  response header so the address bar reflects the page URL rather than the
  partial endpoint.
- The contact form — Alpine validates the fields first, then dispatches a
  custom event that HTMX listens for to `hx-post` to Netlify Forms
  (`hx-swap="none"`), with the response handled entirely by Alpine's
  `htmx:afterRequest` listener.

## Styling

Tailwind v4, configured via `@theme`/`@custom-variant` in
`src/styles/global.css` rather than a `tailwind.config.js`. A few modern CSS
features picked up from recent "CSS Wrapped" round-ups:

- `content-visibility: auto` + `contain-intrinsic-size` on off-screen
  homepage sections and portfolio cards, with a small script that measures
  and back-fills the real intrinsic size, and a `<noscript>` override so
  no-JS visitors never see permanently collapsed content.
- `@property --hue-angle` to make the avatar's hue-rotate effect animatable.
- CSS scroll-driven animations (`scroll-timeline` / `animation-timeline`) for
  the in-page nav's scroll-affordance fade, with no JS scroll listener.
- Native CSS masonry (`display: grid-lanes`) for the Bluesky post grid where
  supported, falling back to a JS masonry library and then a plain grid.
- `text-wrap: balance` / `text-wrap: pretty`, and container-style queries
  (`@container style(...)`) reading a `--live-net-type` custom property to
  adapt behaviour on slow connections.

## Performance

A handful of targeted changes:

- **`content-visibility`**, as above, to cut initial rendering cost for
  off-screen sections.
- **Netlify ISR-style caching** for the homepage, and explicit
  `Cache-Control`/`stale-while-revalidate` headers on the HTMX pagination
  partials.
- **Static prerendering of the GitHub stars listing** — every page of
  `/github-stars/[...page]` is built at compile time via `getStaticPaths()`,
  rather than relying on the SSR partial, so early pagination feels instant.
- **HTMX preloading** of the next pagination page on hover/mousedown.
- **`speculationrules` prerendering** of same-origin links for near-instant
  in-site navigation.
- **Font subsetting** via the `netlify-plugin-subfont` build plugin, plus
  manual preloads for the above-the-fold font weights and a `size-adjust`
  local fallback face to reduce layout shift.
- **Image handling** — portfolio screenshots are captured with
  `capture-website` and served through a Cloudinary proxy with `f_auto,q_auto`
  and responsive `srcset`s; only the hero image is loaded eagerly.
- A **dedicated mobile static build** (`/index-mobile`) rather than a
  client-side device check, so mobile visitors still get a fully static page.

## Other details worth knowing

- **Randomised "grunge" overlays** — portfolio screenshots and map images get
  a Cloudinary grunge texture blended over them at a random opacity per
  render (`src/helpers/textures.ts`), so no two cards look quite the same.
- The **GitHub stars page** and the homepage's GitHub stars section share
  almost all of their code, differing only in whether pagination is static
  or server-rendered.
- The homepage avatar is a small easter egg: press-and-hold fires repeating
  avatar-shaped confetti bursts, built by rasterising the avatar image onto
  an offscreen canvas and feeding it to `canvas-confetti` as a custom shape.
- Device/connection signals (core count, memory, DPR, network type) are
  written once as CSS custom properties and consumed purely via `var()`/
  container-style queries, rather than driving JS class toggling.

## Development

```sh
npm install
npm run dev       # astro dev
npm run build      # astro build
npm run lint       # oxlint src/
npm run format      # oxfmt + prettier
```

Environment variables for the various content collections (GitHub, dev.to,
Airtable, Bluesky, Foursquare, Google Maps, Spotify) are documented inline in
each loader under `src/content/`.
