import { chunk, clamp, invariant, take } from "es-toolkit";

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
  const url = currentUrl
    ? new URL(
        typeof currentUrl === "string" ? currentUrl : currentUrl.toString(),
      )
    : new URL(base, "");

  const searchParams = url.searchParams;

  if (index === 0) {
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
    collectionData = take(
      items,
      itemsPerPage * Math.floor(items.length / itemsPerPage),
    );
  }

  const chunks = chunk(collectionData, itemsPerPage);

  let index = 0;
  const parsedPaginationParam = Number(url.searchParams.get(searchParam));

  if (Number.isInteger(parsedPaginationParam)) {
    index = clamp(parsedPaginationParam, 0, chunks.length - 1);
  }

  const hasPrev = Boolean(index > 0);
  const hasNext = Boolean(index < chunks.length - 1);
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
