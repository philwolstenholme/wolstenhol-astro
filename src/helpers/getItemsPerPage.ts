import { detectMobile } from "./detectMobile";

/**
 * Uses the `Sec-CH-UA-Mobile` header if it's available to work out how many
 * items to show per page. Pass `isMobile` directly to override header detection
 * (needed for prerendered pages where headers aren't available at build time).
 */
export const getItemsPerPage = ({
  astroRequest,
  isMobile,
  mobileItemsPerPage = 5,
  desktopItemsPerPage = 12,
}: {
  astroRequest?: Request;
  isMobile?: boolean;
  mobileItemsPerPage?: number;
  desktopItemsPerPage?: number;
}) => {
  if (isMobile !== undefined) {
    return isMobile ? mobileItemsPerPage : desktopItemsPerPage;
  }

  if (!astroRequest) {
    return desktopItemsPerPage;
  }

  return detectMobile(astroRequest) ? mobileItemsPerPage : desktopItemsPerPage;
};
