import Alpine from "alpinejs";

Alpine.data("pwHeader", () => ({
  activeHash: "",
  activePath: "",
  activeSection: "",

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

    let headingsInView: Element[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const exited = entries.filter((e) => !e.isIntersecting).map((e) => e.target);
        const entered = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        headingsInView = headingsInView.filter((h) => !exited.includes(h));
        headingsInView.push(...entered);
        if (headingsInView.length > 0) {
          this.activeSection = (headingsInView[0] as HTMLElement).dataset.section ?? "";
        }
      },
      { rootMargin: "-120px 0px 0px 0px" },
    );
    document.querySelectorAll("h2[data-section]").forEach((h) => observer.observe(h));
  },

  isActive(hash: string, path: string): boolean {
    if (path && this.activePath === path) return true;
    // Scroll spy takes priority: when a section is in view, ignore the URL hash
    if (this.activeSection) {
      return !!hash && this.activeSection === hash.replace("#", "");
    }
    return !!hash && this.activeHash === hash;
  },
}));
