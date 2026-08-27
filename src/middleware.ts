import { defineMiddleware } from "astro:middleware";

import { detectMobile } from "./helpers/detectMobile";

const PAGINATION_PARAMS = ["githubStars", "posts", "readingList", "speaking"];

export const onRequest = defineMiddleware((context, next) => {
  context.locals.isMobile = detectMobile(context.request);

  const url = new URL(context.request.url);

  // The mobile home page is an internal implementation detail served
  // invisibly via a rewrite (see below). It used to live at `/index-mobile`,
  // and links to that path were shared publicly, so send those visitors to
  // `/` and let the rewrite take over. Matching both slash variants is safe
  // because the internal rewrite now targets `/home-mobile/`, which never
  // matches here — so there is no redirect/rewrite loop.
  if (url.pathname === "/index-mobile" || url.pathname === "/index-mobile/") {
    return context.redirect("/" + url.search, 301);
  }

  if (url.pathname === "/") {
    // Paginated requests are handled by the SSR clone which can read headers
    // directly, so mobile detection there is already correct.
    if (PAGINATION_PARAMS.some((p) => url.searchParams.has(p))) {
      return context.rewrite(new URL("/index-dynamic" + url.search, url));
    }

    // Serve the prerendered mobile variant to mobile visitors. The trailing
    // slash matches the directory-format asset path (`home-mobile/index.html`)
    // so Netlify serves it directly instead of issuing a canonicalising 301
    // that would leak the internal path into the address bar.
    if (context.locals.isMobile) {
      return context.rewrite(new URL("/home-mobile/", url));
    }
  }

  return next();
});
