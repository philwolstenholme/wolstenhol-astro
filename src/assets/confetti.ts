// Shared confetti burst, fired from the centre of a given element. Used by
// the Instagram "party" cards and the homepage avatar easter egg.
export const fireConfettiFrom = async (el: HTMLElement) => {
  document.dispatchEvent(new CustomEvent("play-sound", { detail: "playful-success" }));
  const { default: confetti } = await import("canvas-confetti");
  const rect = el.getBoundingClientRect();
  // getBoundingClientRect() is already viewport-relative — do not add scrollX/Y.
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const defaults = {
    origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
    disableForReducedMotion: true,
  };

  const fire = (ratio: number, opts: object) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(150 * ratio) });

  await fire(0.25, { spread: 26, startVelocity: 55 });
  await fire(0.2, { spread: 60 });
  await fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  await fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  await fire(0.1, { spread: 120, startVelocity: 45 });
};
