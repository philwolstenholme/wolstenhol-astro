import { defineMiddleware } from "astro:middleware";

import { detectMobile } from "./helpers/detectMobile";

const PAGINATION_PARAMS = ["githubStars", "posts", "readingList", "speaking"];

// https://wolstenhol.me is the site's own canonical domain (see
// integrations/subfont.ts's CANONICAL_ROOT) — subfont rewrites a handful of
// above-the-fold image URLs to absolute form as part of its critical-asset
// processing, so 'self' alone doesn't cover them.
const IMG_SOURCES =
  "'self' https://wolstenhol.me https://maps.googleapis.com https://blob.gifcities.org https://res.cloudinary.com";
// Spotify's preview-clip CDN, used both for the <audio> element the JS
// player sets `src` on (media-src) and the progressive-enhancement <a
// target="spotify-preview"> fallback that navigates a hidden iframe when JS
// hasn't taken over the click yet (frame-src).
const SPOTIFY_PREVIEW_SOURCE = "https://p.scdn.co";

// Matches inline <script> elements (no `src` attribute — those are already
// covered by 'self'/an explicit host) and every <style> element (styles have
// no `src` variant). Content is hashed straight out of the rendered response
// rather than from hardcoded source strings: some inline scripts aren't ours
// to control the exact bytes of — e.g. the subfont build integration injects
// a small per-page, per-build async font-loading <script> whose content (and
// hash) differs by page, which no static constant could track.
const INLINE_SCRIPT_RE = /<script(?![^>]*\ssrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const INLINE_STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/gi;

const cspHashCache = new Map<string, Promise<string>>();

const cspHash = (content: string): Promise<string> => {
  let cached = cspHashCache.get(content);
  if (!cached) {
    cached = digestToCspHash(content);
    cspHashCache.set(content, cached);
  }
  return cached;
};

const digestToCspHash = async (content: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return `'sha256-${base64}'`;
};

const extractMatches = (html: string, pattern: RegExp): string[] => {
  const matches: string[] = [];
  for (const match of html.matchAll(pattern)) {
    matches.push(match[1]);
  }
  return matches;
};

const buildDefaultCsp = async (html: string): Promise<string> => {
  const scriptHashes = await Promise.all(extractMatches(html, INLINE_SCRIPT_RE).map(cspHash));
  const styleHashes = await Promise.all(extractMatches(html, INLINE_STYLE_RE).map(cspHash));

  return [
    "default-src 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "worker-src 'none'",
    "frame-ancestors 'none'",
    `frame-src ${SPOTIFY_PREVIEW_SOURCE}`,
    `img-src ${IMG_SOURCES}`,
    // subfont subsets the self-hosted webfonts and embeds the resulting
    // woff2 subsets as data: URIs in its generated stylesheet.
    "font-src 'self' data:",
    "connect-src 'self'",
    `media-src 'self' ${SPOTIFY_PREVIEW_SOURCE}`,
    "manifest-src 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    // Alpine's CSP-safe build (see src/assets/alpine.ts) means the main
    // site never needs 'unsafe-eval' or 'unsafe-inline' here.
    `script-src 'self' ${scriptHashes.join(" ")}`,
    // Inline style="" attributes (dynamic positioning, animation timings,
    // etc.) are pervasive across the site and not practical to hash — CSP
    // has no nonce mechanism for attributes, only unsafe-inline/unsafe-hashes.
    // This is a much smaller attack surface than script-src: it can't execute
    // JS, only affect presentation. <style> elements, by contrast, are hashed
    // like scripts above.
    `style-src-elem 'self' ${styleHashes.join(" ")}`,
    "style-src-attr 'unsafe-inline'",
  ].join("; ");
};

// /submit-reading-item is a legacy, standalone admin form (own old CDN-
// loaded Alpine build, inline handlers, Netlify Identity widget) that
// predates the rest of the site's CSP-safe Alpine migration. Rewriting it
// wasn't in scope, so it gets its own deliberately narrower exception
// instead of weakening the site-wide policy above. It's noindex'd and
// gated behind Netlify Identity login.
const SUBMIT_READING_ITEM_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "worker-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://identity.netlify.com",
  "style-src 'self' 'unsafe-inline'",
].join("; ");

const addStaticSecurityHeaders = (headers: Headers): void => {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
};

const addSecurityHeaders = async (response: Response, pathname: string): Promise<Response> => {
  if (!(response.headers.get("content-type") ?? "").startsWith("text/html")) {
    return response;
  }

  if (pathname === "/submit-reading-item") {
    response.headers.set("Content-Security-Policy", SUBMIT_READING_ITEM_CSP);
    addStaticSecurityHeaders(response.headers);
    return response;
  }

  // Hashing needs the actual rendered HTML, so the body has to be read here
  // and a fresh Response returned with it (the original's body stream can
  // only be consumed once).
  const html = await response.text();
  const rebuilt = new Response(html, response);
  rebuilt.headers.set("Content-Security-Policy", await buildDefaultCsp(html));
  addStaticSecurityHeaders(rebuilt.headers);

  return rebuilt;
};

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.isMobile = detectMobile(context.request);

  const url = new URL(context.request.url);

  if (url.pathname === "/") {
    // Paginated requests are handled by the SSR clone which can read headers
    // directly, so mobile detection there is already correct.
    if (PAGINATION_PARAMS.some((p) => url.searchParams.has(p))) {
      const response = await context.rewrite(new URL("/index-dynamic" + url.search, url));
      return addSecurityHeaders(response, url.pathname);
    }

    // Serve the prerendered mobile variant to mobile visitors.
    if (context.locals.isMobile) {
      const response = await context.rewrite(new URL("/index-mobile", url));
      return addSecurityHeaders(response, url.pathname);
    }
  }

  const response = await next();

  return addSecurityHeaders(response, url.pathname);
});
