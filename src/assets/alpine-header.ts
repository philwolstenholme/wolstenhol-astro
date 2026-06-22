import Alpine from "alpinejs";

Alpine.data("pwHeader", () => ({
  activeHash: "",
  activePath: "",

  init() {
    this.activePath = window.location.pathname;
    this.activeHash = window.location.hash;
    window.addEventListener("hashchange", () => {
      this.activeHash = window.location.hash;
    });
    window.addEventListener("popstate", () => {
      this.activePath = window.location.pathname;
      this.activeHash = window.location.hash;
    });
  },

  isActive(hash: string, path: string): boolean {
    if (path && this.activePath === path) return true;
    if (hash && this.activeHash === hash) return true;
    return false;
  },
}));
