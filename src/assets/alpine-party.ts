import { defineComponent } from "./alpine-define";
import { fireAvatarConfettiFrom } from "./confetti";

const REPEAT_INTERVAL_MS = 300;

export default defineComponent(() => ({
  destroy() {
    this.stopHold();
  },

  fireConfetti() {
    fireAvatarConfettiFrom(this.$root as HTMLElement);
  },

  repeatTimer: null as null | ReturnType<typeof setInterval>,

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
}));
