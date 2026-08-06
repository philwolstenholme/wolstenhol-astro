import { defineComponent } from "./alpine-define";

// Registered via Alpine.data() rather than an inline x-data object literal —
// see alpine-theme-toggle.ts for why.
export default defineComponent(() => ({
  init() {
    this.muted = localStorage.getItem("audioMuted") === "true";
  },

  muted: false,

  // The CSP-safe Alpine build's expression parser only resolves identifiers
  // from the component's own scope — it has no access to JS globals like
  // String(), so `x-bind:aria-pressed="String(muted)"` isn't possible here.
  get mutedLabel(): string {
    return String(this.muted);
  },

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem("audioMuted", String(this.muted));
  },
}));
