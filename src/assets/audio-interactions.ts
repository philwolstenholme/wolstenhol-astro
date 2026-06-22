import { defineSound, ensureReady } from "@web-kits/audio";

import { click, tap, pageEnter, slide } from "../../public/patches/minimal";
import { success as playfulSuccess } from "../../public/patches/playful";

const playClick = defineSound(click);
const playTap = defineSound(tap);
const playPageEnter = defineSound(pageEnter);
const playSlide = defineSound(slide);
const playPlayfulSuccess = defineSound(playfulSuccess);

// pageEnter has a ~58ms envelope (attack 3ms + decay 40ms + release 15ms).
// Speculation-rules prerendering makes navigations near-instant, so we delay
// just enough for the sound to audibly begin before the page swaps.
const NAV_SOUND_DELAY_MS = 60;

let ready = false;

const isMuted = () => localStorage.getItem("audioMuted") === "true";

// The mute toggle button itself must never trigger a sound.
const isMuteToggle = (el: Element) => !!el.closest("#mute-toggle");

document.addEventListener(
  "pointerdown",
  async () => {
    if (!ready)
      await ensureReady().then(() => {
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

    const isHtmx = !!anchor.closest("[hx-get]");
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

    if (isHtmx) {
      // HTMX handles the navigation; just play a sound without redirecting.
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

const sounds: Record<string, () => void> = {
  slide: playSlide,
  "playful-success": playPlayfulSuccess,
};

document.addEventListener("play-sound", async (e: Event) => {
  if (isMuted()) {
    return;
  }

  if (!ready) {
    await ensureReady();
    ready = true;
  }

  sounds[(e as CustomEvent<string>).detail]?.();
});
