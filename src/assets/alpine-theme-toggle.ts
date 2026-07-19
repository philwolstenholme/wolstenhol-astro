import { defineComponent } from "./alpine-define";

// Registered via Alpine.data() (rather than an inline x-data object literal)
// because the CSP-safe Alpine build's expression parser can't evaluate
// object literals containing method shorthand or multi-statement bodies.
export default defineComponent(() => ({
  toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (next === system) {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", next);
    }
    document.documentElement.dataset.theme = next;
  },
}));
