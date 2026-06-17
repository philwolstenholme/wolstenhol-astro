import { defineMiddleware } from "astro:middleware";

const PAGINATION_PARAMS = ["githubStars", "posts", "readingList", "speaking"];

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  if (url.pathname === "/" && PAGINATION_PARAMS.some((p) => url.searchParams.has(p))) {
    return context.rewrite(new URL("/index-dynamic" + url.search, url));
  }

  return next();
});
