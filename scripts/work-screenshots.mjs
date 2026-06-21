/**
 * Generate portfolio screenshots for any entry where `happyWithScreenshot`
 * is not `true`. Output files are named after the URL's hostname + pathname
 * with dots and slashes replaced by hyphens, e.g.:
 *   https://shop.coop.co.uk        → shop-coop-co-uk.png
 *   https://shop.coop.co.uk/basket → shop-coop-co-uk-basket.png
 *
 * Upload the resulting PNGs to Cloudinary and set `cloudinarySuffix` +
 * `happyWithScreenshot: true` in the portfolio frontmatter when done.
 *
 * Usage: node scripts/work-screenshots.mjs
 */

import fs from "fs";

import captureWebsite from "capture-website";
import frontMatter from "front-matter";

const urlToFilename = (url) => {
  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname}`
    .replace(/\.+/g, "-")
    .replace(/\/+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const getSites = () => {
  const files = fs.readdirSync("src/content/portfolio").map((file) => {
    return fs.readFileSync(`src/content/portfolio/${file}`, "utf-8");
  });

  return files
    .map((file) => {
      const { attributes } = frontMatter(file);
      const { url, happyWithScreenshot } = attributes;

      if (happyWithScreenshot || !url) {
        return false;
      }

      return { name: urlToFilename(url), url };
    })
    .filter(Boolean);
};

const getScreenshot = async (site) => {
  try {
    console.log(`Screenshotting ${site.url}…`);
    await captureWebsite.file(site.url, `${site.name}.png`, {
      width: 2560,
      height: 1600,
      delay: 7,
      timeout: 20,
      overwrite: true,
    });
    console.log(`  → ${site.name}.png`);
  } catch (error) {
    console.error(`  ✗ ${site.name}:`, error.message);
  }
};

const sites = getSites();
console.table(sites);

for (const site of sites) {
  await getScreenshot(site);
}
