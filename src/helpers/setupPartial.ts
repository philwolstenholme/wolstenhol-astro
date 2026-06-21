import { buildPageHref } from "./paginate";

export const setupPartial = (
  Astro: { request: Request; response: { headers: Headers } },
  searchParam: string,
  index: number,
): URL | undefined => {
  Astro.response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  Astro.response.headers.set("Netlify-CDN-Cache-Control", "s-maxage=31536000");
  Astro.response.headers.set("X-Robots-Tag", "noindex");

  const htmxCurrentUrl = Astro.request.headers.get("HX-Current-Url");
  if (htmxCurrentUrl) {
    Astro.response.headers.set(
      "HX-Replace-Url",
      buildPageHref({
        currentUrl: new URL(htmxCurrentUrl),
        param: searchParam,
        index,
      }),
    );
    return new URL(htmxCurrentUrl);
  }
  return undefined;
};
