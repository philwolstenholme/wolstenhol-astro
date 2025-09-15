const mobileItemsPerPage = 5;
const desktopItemsPerPage = 12;

/** Uses the `Sec-CH-UA-Mobile` header if it's available to work out how many items to show per page */
export const getItemsPerPage = (astroRequest?: Request) => {
  if (!astroRequest) {
    return desktopItemsPerPage;
  }

  const header = astroRequest.headers.get("Sec-CH-UA-Mobile");
  return header === "?1" ? mobileItemsPerPage : desktopItemsPerPage;
};
