import { defineSound, ensureReady } from "@web-kits/audio";
import { click, pageEnter } from "../../public/patches/minimal";

const playButtonClick = defineSound(click);
const playLinkClick = defineSound(pageEnter);

// Initialised once the AudioContext is running. Kept as a flag so the click
// handler can play synchronously — avoiding any await that would race with
// page navigation on anchor clicks.
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
    } else if (target.closest("a")) {
      playLinkClick();
    }
  },
  true,
);
