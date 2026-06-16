import { defineSound, ensureReady } from "@web-kits/audio";
import { click, tap, pageEnter } from "../../public/patches/minimal";

const playClick = defineSound(click);
const playTap = defineSound(tap);
const playPageEnter = defineSound(pageEnter);

// pageEnter has a ~58ms envelope (attack 3ms + decay 40ms + release 15ms).
// Speculation-rules prerendering makes navigations near-instant, so we delay
// just enough for the sound to audibly begin before the page swaps.
const NAV_SOUND_DELAY_MS = 60;

const PAGINATION_SELECTOR = ".pagination__button";

let ready = false;

const isMuted = () => localStorage.getItem("audioMuted") === "true";

// The mute toggle button itself must never trigger a sound.
const isMuteToggle = (el: Element) => !!el.closest("#mute-toggle");

document.addEventListener(
  "pointerdown",
  () => {
    if (!ready)
      ensureReady().then(() => {
        ready = true;
      });
  },
  { capture: true },
);

document.addEventListener(
  "click",
  (e) => {
    if (!ready || isMuted()) return;
    const target = e.target as Element;
    if (isMuteToggle(target)) return;

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

    if (isPagination) {
      // HTMX handles pagination navigation; just play the sound without redirecting.
      playTap();
    } else if (isPlainNav) {
      e.preventDefault();
      playPageEnter();
      setTimeout(() => {
        window.location.href = href!;
      }, NAV_SOUND_DELAY_MS);
    } else {
      playClick();
    }
  },
  true,
);
