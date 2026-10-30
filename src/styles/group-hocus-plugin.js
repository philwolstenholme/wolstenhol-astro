// Mirrors the hocus variant in global.css: hover only for a precise pointer
// that can hover (touch leaves a faked :hover stuck after a tap), with :active
// giving touch users press feedback instead.
export default function ({ matchVariant }) {
  matchVariant(
    "group-hocus",
    (_value, { modifier }) => {
      const group = modifier ? `.group\\/${modifier}` : ".group";
      return [
        `&:is(:where(${group}):focus *, :where(${group}):active *)`,
        `@media (hover: hover) and (pointer: fine) { &:is(:where(${group}):hover *) }`,
      ];
    },
    { values: { DEFAULT: "" } },
  );
}
