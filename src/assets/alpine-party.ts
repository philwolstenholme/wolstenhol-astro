import { defineComponent } from "./alpine-define";
import { fireAvatarConfettiFrom } from "./confetti";

export default defineComponent(() => ({
  fireConfetti() {
    fireAvatarConfettiFrom(this.$root as HTMLElement);
  },
}));
