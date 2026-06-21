export const getItemsPerPage = ({
  isMobile = false,
  mobileItemsPerPage = 5,
  desktopItemsPerPage = 12,
}: {
  isMobile?: boolean;
  mobileItemsPerPage?: number;
  desktopItemsPerPage?: number;
} = {}) => (isMobile ? mobileItemsPerPage : desktopItemsPerPage);
