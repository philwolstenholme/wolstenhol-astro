export const buildPortfolioImageUrl = (cloudinarySuffix: string, width: number) =>
  `https://res.cloudinary.com/wolstenh/image/upload/c_scale,w_${width},f_auto,q_auto/${cloudinarySuffix}`;
