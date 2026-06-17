import { sample } from "es-toolkit";

// The exact set of tilt angles used on the original wolstenhol.me reading list.
// `null` is one of the options, so a chunk of cards sit perfectly straight and
// the rest lean very slightly either way — giving the "hand-placed sticky note"
// look without anything tilting far enough to feel broken.
//
// The original picked a fresh `unique-random-array` for every card and called
// it once, so its no-repeat behaviour never actually carried between cards —
// it was effectively a uniform random pick, which is what we do here.
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

export const getRandomRotation = () => sample(readingRotations);
