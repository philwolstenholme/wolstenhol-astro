import { defineComponent } from "./alpine-define";

export default defineComponent(() => ({
  activeHash: "",
  activePath: "",
  activeSection: "",
  _cleanup: null as (() => void) | null,

  init() {
    this.activePath = window.location.pathname;
    this.activeHash = window.location.hash;

    const onHashChange = () => {
      this.activeHash = window.location.hash;
    };
    const onPopState = () => {
      this.activePath = window.location.pathname;
      this.activeHash = window.location.hash;
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onPopState);

    let headingsInView: Element[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const exited: Element[] = [];
        const entered: Element[] = [];
        for (const e of entries) {
          (e.isIntersecting ? entered : exited).push(e.target);
        }
        headingsInView = headingsInView.filter((h) => !exited.includes(h));
        headingsInView.push(...entered);
        if (headingsInView.length > 0) {
          this.activeSection = (headingsInView[0] as HTMLElement).dataset.section ?? "";
        }
      },
      { rootMargin: "-120px 0px 0px 0px" },
    );
    document.querySelectorAll("h2[data-section]").forEach((h) => observer.observe(h));

    this._cleanup = () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopState);
      observer.disconnect();
    };
  },

  destroy() {
    this._cleanup?.();
  },

  isActive(el: HTMLAnchorElement): boolean {
    const { hash, pathname } = el;
    // Path-only links: active when the current pathname matches
    if (!hash && pathname !== "/" && pathname === this.activePath) {
      return true;
    }
    // Scroll spy takes priority over URL hash for anchor links
    if (this.activeSection) {
      return !!hash && this.activeSection === hash.slice(1);
    }
    return !!hash && this.activeHash === hash;
  },
}));
