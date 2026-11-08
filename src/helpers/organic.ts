// Small render-time randomisers that knock the machine precision off things
// that would otherwise be identical every time they appear: headings'
// squiggles, cards stuck to the page, the corners of form fields. Values are
// regenerated per build/render, so the page never looks quite the same twice.

// A random number in [min, max), rounded to `decimals` places.
export const randomBetween = (min: number, max: number, decimals = 1): number =>
  Number((min + Math.random() * (max - min)).toFixed(decimals));

// A slight tilt, as if the element were stuck on by hand. Always returns a
// non-zero angle so nothing ends up looking accidentally straight.
export const randomTilt = (maxDeg = 0.6): string => {
  const angle = randomBetween(0.15, maxDeg, 2);
  return `${Math.random() < 0.5 ? -angle : angle}deg`;
};

// An uneven, hand-cut border-radius: each corner gets its own horizontal and
// vertical radius, so the box reads as drawn rather than ruled.
export const wobblyRadius = (min = 2, max = 14): string => {
  const corner = () => `${Math.round(randomBetween(min, max))}px`;
  return `${corner()} ${corner()} ${corner()} ${corner()} / ${corner()} ${corner()} ${corner()} ${corner()}`;
};
