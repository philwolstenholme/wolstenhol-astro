import { defineComponent } from "./alpine-define";

// Registered via Alpine.data() rather than an inline x-init with multiple
// statements — the CSP-safe Alpine build's expression parser only accepts a
// single expression per directive, so this now lives in the automatic
// init() lifecycle hook instead.
export default defineComponent(() => ({
  init() {
    const root = this.$root as HTMLElement;
    root.removeAttribute("hidden");

    const perfData = window.performance.timing;
    this.time = ((perfData.loadEventEnd - perfData.navigationStart) / 1000).toFixed(2);

    if (Number(this.time) < 0) {
      root.remove();
    }
  },

  time: null as null | string,
}));
