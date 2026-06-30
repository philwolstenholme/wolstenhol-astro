// Texture URLs and helpers carried over from the original wolstenhol.me site.
// The grunge wall sits over the solid-coloured cards (speaking testimonials,
// DEV.to posts) as a mix-blend-multiply overlay with a randomised opacity, so
// no two cards end up looking quite the same.

const grungeWallBase =
  "/proxy/cloudinary/image/upload/c_fill,g_north,w_{w},h_{h},f_auto,q_70,fl_progressive/v1661284312/one-offs/white-grungy-wall-textured-background.jpg";

export const grungeWallSrc = grungeWallBase.replace("{w}", "365").replace("{h}", "199");

export const grungeWallSrcSet = `${grungeWallBase.replace("{w}", "730").replace("{h}", "398")} 2x`;

export const randomGrungeOpacity = () => Math.round((Math.random() / 1.5) * 100) / 100;
