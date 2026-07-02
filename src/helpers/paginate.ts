import { chunk, clamp, take } from "es-toolkit";

// Placeholder origin so relative paths work with the URL constructor; only the
// path + search + hash of the result is ever used.
const PLACEHOLDER_ORIGIN = "http://x";

type PageHrefOptions = {
  currentUrl?: URL;
  base?: string;
  param?: string;
  anchor?: string;
  index: number | null;
};

export const buildPageHref = ({
  currentUrl,
  base = "/",
  param = "page",
  anchor,
  index,
}: PageHrefOptions): string => {
  const url = currentUrl ? new URL(currentUrl.toString()) : new URL(base, PLACEHOLDER_ORIGIN);

  const searchParams = url.searchParams;

  if (index === 0 || index === null) {
    searchParams.delete(param);
  } else {
    searchParams.set(param, index.toString());
  }

  let result = url.pathname;

  const queryString = searchParams.toString();
  if (queryString) {
    result += "?" + queryString;
  }

  if (anchor) {
    result += "#" + anchor;
  }

  return result;
};

/**
 * Build a URL for an HTMX partial endpoint. Page 0 omits the param entirely
 * (matching the server-side convention). perPage is included so the partial
 * doesn't need to re-detect the device type.
 */
export const buildPartialHref = (
  partialPath: string,
  param: string,
  index: number | null,
  perPage?: number,
): string => {
  const href = buildPageHref({ base: partialPath, param, index });

  if (perPage === undefined) {
    return href;
  }

  const url = new URL(href, PLACEHOLDER_ORIGIN);
  url.searchParams.set("perPage", perPage.toString());
  const qs = url.searchParams.toString();
  return url.pathname + (qs ? `?${qs}` : "");
};

export type PaginationInput<T> = {
  items: readonly T[];
  itemsPerPage: number;
  url: URL;
  searchParam?: string;
  onlyFullPages?: boolean;
};

export const paginate = <T>({
  items,
  itemsPerPage,
  url,
  searchParam = "page",
  onlyFullPages = false,
}: PaginationInput<T>) => {
  let collectionData = items;

  if (onlyFullPages) {
    collectionData = take(items, itemsPerPage * Math.floor(items.length / itemsPerPage));
  }

  const chunks = chunk(collectionData, itemsPerPage);

  const parsedPaginationParam = Number(url.searchParams.get(searchParam));
  const index = Number.isInteger(parsedPaginationParam)
    ? clamp(parsedPaginationParam, 0, Math.max(chunks.length - 1, 0))
    : 0;

  const hasPrev = index > 0;
  const hasNext = index < chunks.length - 1;
  const prevIndex = hasPrev ? index - 1 : null;
  const nextIndex = hasNext ? index + 1 : null;

  return {
    data: chunks[index] || [],
    index,
    hasPrev,
    hasNext,
    prevIndex,
    nextIndex,
  };
};
