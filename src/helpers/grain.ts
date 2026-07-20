// Network-free grunge texture, generated with SVG feTurbulence and inlined as a
// data URI. The raster textures carried over from wolstenhol.me (the grunge
// wall, coffee stains, subtle-grunge paper) all come down the wire from the
// Cloudinary proxy and are dropped entirely on slow connections — so the page
// can end up completely flat. This procedural grain rides on top of everything
// as a fixed film-grain layer: it costs no requests, tiles seamlessly, and
// gives the whole site the same organic, photocopied tooth whether or not the
// imagery loads.

interface NoiseOptions {
  // Higher = finer, denser grain. ~0.9 reads as paper speckle, ~0.35 as blotchy
  // grime.
  baseFrequency: number;
  // More octaves = more detail layered in, at a little more cost.
  numOctaves?: number;
  // Tile size in px; the turbulence is stitched so it repeats seamlessly.
  size?: number;
}

// Build a seamless grayscale-noise tile as a data URI. `stitchTiles="stitch"`
// keeps the turbulence continuous across tile boundaries so a small tile can be
// repeated over the whole viewport without visible seams.
const buildNoiseDataUri = ({ baseFrequency, numOctaves = 2, size = 220 }: NoiseOptions) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

  // Minimal URL-encoding — only the characters that actually break an unquoted
  // data URI in CSS — keeps the string short and readable.
  const encoded = svg
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/#/g, "%23")
    .replace(/"/g, "'");

  return `url("data:image/svg+xml,${encoded}")`;
};

// The fine paper grain multiplied over the light theme: dense enough to read as
// tooth on the paper, faint enough to leave body copy crisp.
export const grainFine = buildNoiseDataUri({ baseFrequency: 0.9 });

// A coarser, blotchier layer that reads as grime/foxing rather than even grain.
// Paired with the fine grain it stops the texture looking like uniform TV static.
export const grainCoarse = buildNoiseDataUri({ baseFrequency: 0.32, numOctaves: 3 });
