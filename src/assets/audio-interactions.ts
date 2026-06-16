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

let readyPromise: Promise<AudioContext> | null = null;

function getReady() {
  if (!readyPromise) readyPromise = ensureReady();
  return readyPromise;
}

document.addEventListener(
  "click",
  async (e) => {
    const target = e.target as Element;
    const isButton = !!target.closest("button");
    const isLink = !!target.closest("a");
    if (!isButton && !isLink) return;

    await getReady();

    if (isButton) {
      buttonClick();
    } else {
      linkClick();
    }
  },
  true,
);
