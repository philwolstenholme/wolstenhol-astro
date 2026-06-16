import { defineSound, ensureReady } from "@web-kits/audio";

// Minimal library — synthesised UI sounds via @web-kits/audio
const buttonClick = defineSound({
  source: { type: "noise", color: "white" },
  filter: { type: "bandpass", frequency: 1800, resonance: 3 },
  envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.02 },
  gain: 0.12,
});

const linkClick = defineSound({
  source: { type: "sine", frequency: { start: 900, end: 500 } },
  envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.03 },
  gain: 0.08,
});

// Initialised once the AudioContext is running. Kept as a flag so the click
// handler can play synchronously — avoiding the await that would race with
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
      buttonClick();
    } else if (target.closest("a")) {
      linkClick();
    }
  },
  true,
);
