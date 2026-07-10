import { getItemsPerPage } from "./getItemsPerPage";
import { paginate } from "./paginate";
import { setupPartial } from "./setupPartial";

type PreparePartialPageAstro = {
  locals: { isMobile?: boolean };
  request: Request;
  response: { headers: Headers };
  url: URL;
};

type PreparePartialPageOptions<T> = {
  items: readonly T[];
  itemsPerPage?: number;
  searchParam: string;
};

/**
 * Shared setup for the /partials/* HTMX endpoints: works out how many items
 * fit per page, paginates, and wires up the HX-Replace-Url response header.
 */
export const preparePartialPage = <T>(
  Astro: PreparePartialPageAstro,
  { items, itemsPerPage, searchParam }: PreparePartialPageOptions<T>,
) => {
  const resolvedItemsPerPage =
    itemsPerPage !== undefined
      ? itemsPerPage
      : Number(Astro.url.searchParams.get("perPage")) ||
        getItemsPerPage({ isMobile: Astro.locals.isMobile });

  const { index } = paginate({
    items,
    itemsPerPage: resolvedItemsPerPage,
    onlyFullPages: true,
    searchParam,
    url: new URL(Astro.request.url),
  });

  const pageUrl = setupPartial(Astro, searchParam, index);

  return { itemsPerPage: resolvedItemsPerPage, pageUrl };
};
