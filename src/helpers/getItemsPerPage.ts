export const getItemsPerPage = ({
  desktopItemsPerPage = 12,
  isMobile = false,
  mobileItemsPerPage = 5,
}: {
  desktopItemsPerPage?: number;
  isMobile?: boolean;
  mobileItemsPerPage?: number;
} = {}) => (isMobile ? mobileItemsPerPage : desktopItemsPerPage);
