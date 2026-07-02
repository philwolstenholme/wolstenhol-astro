import { getItemsPerPage } from "./getItemsPerPage";
import { paginate } from "./paginate";
import { setupPartial } from "./setupPartial";

type PreparePartialPageAstro = {
  request: Request;
  response: { headers: Headers };
  url: URL;
  locals: { isMobile?: boolean };
};

type PreparePartialPageOptions<T> = {
  items: readonly T[];
  searchParam: string;
  itemsPerPage?: number;
};

/**
 * Shared setup for the /partials/* HTMX endpoints: works out how many items
 * fit per page, paginates, and wires up the HX-Replace-Url response header.
 */
export const preparePartialPage = <T>(
  Astro: PreparePartialPageAstro,
  { items, searchParam, itemsPerPage }: PreparePartialPageOptions<T>,
) => {
  const resolvedItemsPerPage =
    itemsPerPage !== undefined
      ? itemsPerPage
      : Number(Astro.url.searchParams.get("perPage")) ||
        getItemsPerPage({ isMobile: Astro.locals.isMobile });

  const { index } = paginate({
    items,
    itemsPerPage: resolvedItemsPerPage,
    url: new URL(Astro.request.url),
    searchParam,
    onlyFullPages: true,
  });

  const pageUrl = setupPartial(Astro, searchParam, index);

  return { itemsPerPage: resolvedItemsPerPage, pageUrl };
};
