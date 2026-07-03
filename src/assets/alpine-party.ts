import { defineComponent } from "./alpine-define";
import { fireAvatarConfettiFrom } from "./confetti";

const REPEAT_INTERVAL_MS = 300;

export default defineComponent(() => ({
  repeatTimer: null as ReturnType<typeof setInterval> | null,

  fireConfetti() {
    fireAvatarConfettiFrom(this.$root as HTMLElement);
  },

  // Press-and-hold (mouse, touch, or a held Enter/Space) fires a burst
  // straight away and keeps them coming until release.
  startHold() {
    if (this.repeatTimer !== null) {
      return;
    }
    this.fireConfetti();
    this.repeatTimer = setInterval(() => this.fireConfetti(), REPEAT_INTERVAL_MS);
  },

  stopHold() {
    if (this.repeatTimer !== null) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
  },

  destroy() {
    this.stopHold();
  },
}));
