// Confetti bursts fired from the centre of a given element. Used by the
// Instagram "party" cards (classic confetti) and the homepage avatar easter
// egg (a shower of little spinning avatar faces).

const AVATAR_SRC =
  "/proxy/cloudinary/image/upload/c_scale,f_auto,q_auto,w_96/v1545084898/avatar_egzcjk.png";
const AVATAR_BITMAP_SIZE = 64;

const originFor = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  // getBoundingClientRect() is already viewport-relative — do not add scrollX/Y.
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
};

const baseOptions = (el: HTMLElement) => ({
  origin: originFor(el),
  disableForReducedMotion: true,
  particleCount: 75,
  spread: 100,
  startVelocity: 40,
});

export const fireConfettiFrom = async (el: HTMLElement) => {
  document.dispatchEvent(new CustomEvent("play-sound", { detail: "playful-success" }));
  const { default: confetti } = await import("canvas-confetti");
  await confetti(baseOptions(el));
};

// The avatar drawn as a circular bitmap at three different scales. Each
// particle picks a shape at random, so the faces come out in mixed sizes
// (rotation comes free — bitmap particles spin as they wobble). Built once
// and cached.
let avatarShapes: import("canvas-confetti").Shape[] | undefined;

const loadAvatarShapes = async () => {
  if (avatarShapes) {
    return avatarShapes;
  }
  const img = new Image();
  img.src = AVATAR_SRC;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_BITMAP_SIZE;
  canvas.height = AVATAR_BITMAP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2d context unavailable");
  }
  ctx.beginPath();
  ctx.arc(AVATAR_BITMAP_SIZE / 2, AVATAR_BITMAP_SIZE / 2, AVATAR_BITMAP_SIZE / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, AVATAR_BITMAP_SIZE, AVATAR_BITMAP_SIZE);
  const bitmap = await createImageBitmap(canvas);
  // The matrix must stay a plain array — canvas-confetti passes shapes to a
  // web worker, and a DOMMatrix instance can't be reconstructed there.
  avatarShapes = [2.5, 4, 6].map((downscale) => ({
    type: "bitmap",
    bitmap,
    matrix: [
      1 / downscale,
      0,
      0,
      1 / downscale,
      -AVATAR_BITMAP_SIZE / (2 * downscale),
      -AVATAR_BITMAP_SIZE / (2 * downscale),
    ],
  })) as unknown as import("canvas-confetti").Shape[];
  return avatarShapes;
};

// One burst of spinning avatar faces in assorted sizes. Falls back to
// regular confetti if the avatar image can't be loaded or drawn.
export const fireAvatarConfettiFrom = async (el: HTMLElement) => {
  document.dispatchEvent(new CustomEvent("play-sound", { detail: "playful-success" }));
  const { default: confetti } = await import("canvas-confetti");
  const options = { ...baseOptions(el), particleCount: 40 };
  try {
    const shapes = await loadAvatarShapes();
    await confetti({ ...options, shapes, scalar: 2 });
  } catch {
    await confetti(options);
  }
};
