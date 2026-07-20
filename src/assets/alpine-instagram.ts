import { defineComponent } from "./alpine-define";
import { fireConfettiFrom } from "./confetti";

export default defineComponent(() => ({
  async fireConfetti() {
    await fireConfettiFrom(this.$root as HTMLElement);
  },

  init() {
    const mql = window.matchMedia("(hover: hover)");
    this.useLightbox = mql.matches;
    mql.addEventListener("change", (e: Event) => {
      this.useLightbox = (e as MediaQueryListEvent).matches;
    });
  },

  // Replaces an inline x-on:click.prevent that used an `if` statement and
  // `new CustomEvent(...)` — neither is supported by the CSP-safe Alpine
  // build's expression parser, which only understands single expressions.
  openLightbox() {
    if (this.useLightbox) {
      (this.$root as HTMLElement).dispatchEvent(
        new CustomEvent("pw-lightbox-open", { bubbles: true }),
      );
    }
  },

  useLightbox: false,
}));
