import { UAParser } from "ua-parser-js";
import { defineMiddleware } from "astro:middleware";

const PAGINATION_PARAMS = ["githubStars", "posts", "readingList", "speaking"];

function isMobileRequest(request: Request): boolean {
  // Prefer Sec-CH-UA-Mobile client hint — precise and cheap.
  const clientHint = request.headers.get("Sec-CH-UA-Mobile");
  if (clientHint !== null) {
    return clientHint === "?1";
  }

  // Fall back to UA sniffing when the client hint isn't sent.
  const ua = request.headers.get("User-Agent");
  if (ua) {
    const { device } = UAParser(ua);
    return (["mobile", "wearable"] as (typeof device.type)[]).includes(
      device.type,
    );
  }

  return false;
}

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  if (url.pathname === "/") {
    // Paginated requests are handled by the SSR clone which can read headers
    // directly, so mobile detection there is already correct.
    if (PAGINATION_PARAMS.some((p) => url.searchParams.has(p))) {
      return context.rewrite(new URL("/index-dynamic" + url.search, url));
    }

    // Serve the prerendered mobile variant to mobile visitors.
    if (isMobileRequest(context.request)) {
      return context.rewrite(new URL("/index-mobile", url));
    }
  }

  return next();
});
