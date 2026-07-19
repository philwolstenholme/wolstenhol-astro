import { defineComponent } from "./alpine-define";

// Registered via Alpine.data() rather than an inline x-data object literal —
// the previous x-on handlers ran two statements ("open = true;
// $dispatch(...)"), which the CSP-safe Alpine build's expression parser
// can't evaluate (it only accepts a single expression per directive).
export default defineComponent(() => ({
  open: false,

  reveal() {
    this.open = true;
    this.$dispatch("play-sound", "slide");
  },
}));
