import { UAParser } from "ua-parser-js";

/**
 * Uses the `Sec-CH-UA-Mobile` header if it's available to work out how many
 * items to show per page.
 */
export const getItemsPerPage = ({
  astroRequest,
  mobileItemsPerPage = 5,
  desktopItemsPerPage = 12,
}: {
  astroRequest?: Request;
  mobileItemsPerPage?: number;
  desktopItemsPerPage?: number;
}) => {
  if (!astroRequest) {
    return desktopItemsPerPage;
  }

  // Prefer client hints if available.
  const clientHintMobile = astroRequest.headers.get("Sec-CH-UA-Mobile");
  if (clientHintMobile) {
    return clientHintMobile === "?1" ? mobileItemsPerPage : desktopItemsPerPage;
  }

  // User agent sniff if we must.
  const userAgent = astroRequest.headers.get("User-Agent");
  if (userAgent) {
    const { device } = UAParser(userAgent);
    const smallScreenDeviceTypes: (typeof device.type)[] = [
      "mobile",
      "wearable",
    ];
    return smallScreenDeviceTypes.includes(device.type)
      ? mobileItemsPerPage
      : desktopItemsPerPage;
  }

  return desktopItemsPerPage;
};
