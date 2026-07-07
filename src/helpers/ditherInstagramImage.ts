import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { createCanvas, loadImage } from "canvas";
import { aitjcizeSpectra6Palette, ditherImage, suggestCanvasProcessingOptions } from "epdoptimize";

const OUTPUT_DIR = join(process.cwd(), "public/instagram-dithered");
const PUBLIC_PATH = "/instagram-dithered";

// epdoptimize is typed against DOM canvases; node-canvas is API-compatible.
type DOMCanvas = Parameters<typeof ditherImage>[0];

/**
 * Fetches an Instagram photo from Cloudinary at build time and dithers it with
 * epdoptimize's automatic processing (e-ink Spectra 6 palette, "natural"
 * intent) for a subtle retro effect. Results are cached on disk per post id.
 * Returns the public URL of the dithered PNG, or null if processing fails.
 */
export const ditherInstagramImage = async (id: string, width: number): Promise<string | null> => {
  const filename = `${id}.png`;
  const outputPath = join(OUTPUT_DIR, filename);
  const publicUrl = `${PUBLIC_PATH}/${filename}`;

  if (existsSync(outputPath)) {
    return publicUrl;
  }

  try {
    // f_jpg rather than f_auto: node-canvas can't decode AVIF.
    const response = await fetch(
      `https://res.cloudinary.com/wolstenh/image/upload/f_jpg,q_auto,w_${width}/11ty/instagram/${id}`,
    );
    if (!response.ok) {
      throw new Error(`Cloudinary responded with ${response.status}`);
    }

    const image = await loadImage(Buffer.from(await response.arrayBuffer()));
    const input = createCanvas(image.width, image.height);
    input.getContext("2d").drawImage(image, 0, 0);
    const output = createCanvas(image.width, image.height);

    const suggestion = suggestCanvasProcessingOptions(
      input as unknown as DOMCanvas,
      aitjcizeSpectra6Palette,
      { intent: "natural" },
    );
    // Keep the auto-suggested dither algorithm, but swap the tone handling for
    // the "dynamic" preset (S-curve, no range compression) — the suggestion's
    // own dynamicRangeCompression washes photos out, so it must not override
    // the preset.
    const {
      processingPreset: _preset,
      dynamicRangeCompression: _drc,
      ...ditherOptions
    } = suggestion.ditherOptions;
    await ditherImage(input as unknown as DOMCanvas, output as unknown as DOMCanvas, {
      ...ditherOptions,
      processingPreset: "dynamic",
      palette: aitjcizeSpectra6Palette,
    });

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(outputPath, output.toBuffer("image/png"));
    return publicUrl;
  } catch (error) {
    console.warn(`Instagram: failed to dither image ${id}`, error);
    return null;
  }
};
