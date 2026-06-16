import { defineSound, ensureReady } from "@web-kits/audio";
import { click, tap, hover, pageEnter } from "../../public/patches/minimal";

const playClick = defineSound(click);
const playTap = defineSound(tap);
const playHover = defineSound(hover);
const playPageEnter = defineSound(pageEnter);

// pageEnter has a ~58ms envelope (attack 3ms + decay 40ms + release 15ms).
// Speculation-rules prerendering makes navigations near-instant, so we delay
// just enough for the sound to audibly begin before the page swaps.
const NAV_SOUND_DELAY_MS = 60;

const PAGINATION_SELECTOR = ".pagination__button";

let ready = false;

document.addEventListener(
  "pointerdown",
  () => {
    if (!ready) ensureReady().then(() => { ready = true; });
  },
  { capture: true },
);

// Hover sound on pagination buttons — only on non-touch devices.
let isTouch = false;
document.addEventListener("touchstart", () => { isTouch = true; }, { once: true, passive: true });

document.addEventListener("mouseover", (e) => {
  if (!ready || isTouch) return;
  const target = e.target as Element;
  if (target.closest(PAGINATION_SELECTOR)) playHover();
});

document.addEventListener(
  "click",
  (e) => {
    if (!ready) return;
    const target = e.target as Element;

    // Buttons always get the click sound, no navigation delay needed.
    if (target.closest("button")) {
      playClick();
      return;
    }

    const anchor = target.closest("a");
    if (!anchor) return;

    const isPagination = !!anchor.closest(PAGINATION_SELECTOR);
    const href = anchor.getAttribute("href");

    // Skip modifier-key combos, new-tab links, non-navigating hrefs.
    const isPlainNav =
      href &&
      !anchor.target &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      !href.startsWith("#") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("tel:");

    if (isPagination && isPlainNav) {
      // Delay navigation so the tap sound can be heard before the page swaps.
      e.preventDefault();
      playTap();
      setTimeout(() => { window.location.href = href!; }, NAV_SOUND_DELAY_MS);
    } else {
      playClick();
      if (isPlainNav) {
        e.preventDefault();
        setTimeout(() => { window.location.href = href!; }, NAV_SOUND_DELAY_MS);
      }
    }
  },
  true,
);
