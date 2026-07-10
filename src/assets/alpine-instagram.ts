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

  useLightbox: false,
}));
