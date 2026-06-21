import { sample } from "es-toolkit";

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

let previous: Rotation | undefined;

export const getRandomRotation = (): Rotation => {
  const candidates = readingRotations.filter((r) => r !== previous) as Rotation[];
  const next = sample(candidates)!;
  previous = next;
  return next;
};
