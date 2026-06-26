declare module "async-alpine" {
  import type AlpineType from "alpinejs";
  const AsyncAlpine: (Alpine: typeof AlpineType) => void;
  export default AsyncAlpine;
}
