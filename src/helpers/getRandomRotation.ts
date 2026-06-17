import { sample } from "es-toolkit";

// The exact set of tilt angles used on the original wolstenhol.me reading list.
// `null` is one of the options, so some cards sit perfectly straight and the
// rest lean very slightly either way — giving the "hand-placed sticky note"
// look without anything tilting far enough to feel broken.
const readingRotations = [
  "-1.2deg",
  "-1.1deg",
  "-1deg",
  "-0.5deg",
  null,
  "0.5deg",
  "1deg",
  "1.1deg",
  "1.2deg",
] as const;

type Rotation = (typeof readingRotations)[number];

// Remember the last tilt we handed out so we never give the same one to two
// cards in a row, keeping neighbouring cards distinct. This is what the
// original's `unique-random-array` was meant to do — it just got rebuilt for
// every card, which reset its memory each time. A single shared picker (this
// module-level value) is what makes the no-repeat behaviour actually stick.
let previous: Rotation | undefined;

export const getRandomRotation = (): Rotation => {
  let next = sample(readingRotations);
  while (next === previous) {
    next = sample(readingRotations);
  }
  previous = next;
  return next;
};
