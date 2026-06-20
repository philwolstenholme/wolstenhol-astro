export default function ({ matchVariant }) {
  matchVariant(
    "group-hocus",
    (_value, { modifier }) => {
      const group = modifier ? `.group\\/${modifier}` : ".group";
      return `&:is(:where(${group}):hover *, :where(${group}):focus *)`;
    },
    { values: { DEFAULT: "" } },
  );
}
