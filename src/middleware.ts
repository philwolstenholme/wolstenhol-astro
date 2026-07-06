import { defineMiddleware } from "astro:middleware";

import { detectMobile } from "./helpers/detectMobile";

const PAGINATION_PARAMS = ["githubStars", "posts", "readingList", "speaking"];

export const onRequest = defineMiddleware((context, next) => {
  context.locals.isMobile = detectMobile(context.request);

  const url = new URL(context.request.url);

  if (url.pathname === "/") {
    // Paginated requests are handled by the SSR clone which can read headers
    // directly, so mobile detection there is already correct.
    if (PAGINATION_PARAMS.some((p) => url.searchParams.has(p))) {
      return context.rewrite(new URL("/index-dynamic" + url.search, url));
    }

    // Serve the prerendered mobile variant to mobile visitors.
    if (context.locals.isMobile) {
      return context.rewrite(new URL("/index-mobile", url));
    }
  }

  return next();
});
