import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import subfontBuild from "subfont";

// Self-hosted, so no network round-trip is needed to resolve it (and it keeps
// the build reproducible without a `site` in astro.config.mjs).
const CANONICAL_ROOT = "https://wolstenhol.me/";

const findHtmlFiles = async (root: string) => {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => `${entry.parentPath}/${entry.name}`);
};

const toConsole = (logger: AstroIntegrationLogger) => ({
  error: (...args: unknown[]) => logger.error(args.join(" ")),
  info: (...args: unknown[]) => logger.info(args.join(" ")),
  log: (...args: unknown[]) => logger.info(args.join(" ")),
  warn: (...args: unknown[]) => logger.warn(args.join(" ")),
});

// Subsets the self-hosted Roboto Slab webfonts down to the glyphs each
// prerendered page actually uses, and rewrites their @font-face/preload tags
// to point at the subsets. Runs after Astro (and the adapter) have finished
// writing dist/, since that's the only point the final HTML exists on disk —
// a Vite `closeBundle` hook fires too early, before prerendering happens.
export const subfont = (): AstroIntegration => ({
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const root = fileURLToPath(dir);
      const inputFiles = await findHtmlFiles(root);

      if (inputFiles.length === 0) {
        logger.warn("No prerendered HTML files found, skipping font subsetting");
        return;
      }

      await subfontBuild(
        {
          canonicalRoot: CANONICAL_ROOT,
          inPlace: true,
          inputFiles,
          root,
        },
        toConsole(logger),
      );
    },
  },
  name: "subfont",
});
