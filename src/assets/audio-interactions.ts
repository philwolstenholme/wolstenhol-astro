import { defineSound, ensureReady } from "@web-kits/audio";
import { click, pageEnter } from "../../public/patches/minimal";

const playButtonClick = defineSound(click);
const playLinkClick = defineSound(pageEnter);

// pageEnter has a ~58ms envelope (attack 3ms + decay 40ms + release 15ms).
// Speculation-rules prerendering makes navigations near-instant, so we delay
// just enough for the sound to audibly begin before the page swaps.
const NAV_SOUND_DELAY_MS = 60;

let ready = false;

document.addEventListener(
  "pointerdown",
  () => {
    if (!ready) ensureReady().then(() => { ready = true; });
  },
  { capture: true },
);

document.addEventListener(
  "click",
  (e) => {
    if (!ready) return;
    const target = e.target as Element;

    if (target.closest("button")) {
      playButtonClick();
      return;
    }

    const anchor = target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    // Only delay same-page navigations; skip modifier keys, new tabs, non-href.
    if (
      !href ||
      anchor.target === "_blank" ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      playLinkClick();
      return;
    }

    e.preventDefault();
    playLinkClick();
    setTimeout(() => { window.location.href = href; }, NAV_SOUND_DELAY_MS);
  },
  true,
);
