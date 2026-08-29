// htmx 4 ships an official preload extension (htmx.org/dist/ext/hx-preload.js)
// that replaces the hand-rolled htmx 2 extension this file used to contain.
// It prefetches an element's hx-get URL on mousedown/touchstart so the eventual
// swap feels instant. Opt in per element with the `hx-preload` attribute.
//
// The extension is an IIFE that reads the global `htmx`. Importing the htmx ESM
// build assigns `window.htmx`, so we set the global explicitly and then load the
// extension via a dynamic import to guarantee it runs after htmx is available.
import htmx from "htmx.org";

declare global {
  interface Window {
    htmx: typeof htmx;
  }
}

window.htmx = htmx;

await import("htmx.org/dist/ext/hx-preload.js");
