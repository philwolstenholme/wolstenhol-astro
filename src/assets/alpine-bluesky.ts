import { defineComponent } from "./alpine-define";

declare global {
  interface Window {
    Colcade: new (el: Element, options: { columns: string; items: string }) => object;
  }
}

export default defineComponent(() => ({
  colcadeInstance: null as null | object,
  colcadeLoading: false,

  initMasonry() {
    if (CSS.supports("display", "grid-lanes")) return;
    if (window.innerWidth > 767 && this.colcadeInstance === null && !this.colcadeLoading) {
      this.colcadeLoading = true;
      this.loadColcade();
    }
  },

  loadColcade() {
    const script = document.createElement("script");
    script.src = "/proxy/jsdelivr/npm/colcade@0.2.0/colcade.js";
    script.integrity = "sha256-ZxEJSCFR4d0OThzWuZ8CYCzw+pDoV/E0/+4EWoLO6Eg=";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      try {
        this.colcadeInstance = new window.Colcade(this.$root as Element, {
          columns: ".posts-grid__col",
          items: ".posts-grid__item",
        });
      } catch (error) {
        console.error("Colcade initialization failed:", error);
        this.colcadeLoading = false;
      }
    };
    document.head.appendChild(script);
  },
}));
