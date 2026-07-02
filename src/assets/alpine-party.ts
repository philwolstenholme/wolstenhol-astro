import { defineComponent } from "./alpine-define";
import { fireConfettiFrom } from "./confetti";

export default defineComponent(() => ({
  fireConfetti() {
    fireConfettiFrom(this.$root as HTMLElement);
  },
}));
