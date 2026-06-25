import Alpine from "alpinejs";

declare global {
  interface Window {
    Colcade: new (el: Element, options: { columns: string; items: string }) => object;
  }
}

Alpine.data("twitterFeed", () => ({
  colcadeInstance: null as object | null,
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
    script.src = "https://wolstenhol.me/proxy/jsdelivr/npm/colcade@0.2.0/colcade.js";
    script.integrity = "sha256-ZxEJSCFR4d0OThzWuZ8CYCzw+pDoV/E0/+4EWoLO6Eg=";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      try {
        this.colcadeInstance = new window.Colcade(this.$root as Element, {
          columns: ".tweets-grid__col",
          items: ".tweets-grid__item",
        });
      } catch (error) {
        console.error("Colcade initialization failed:", error);
        this.colcadeLoading = false;
      }
    };
    document.head.appendChild(script);
  },
}));
