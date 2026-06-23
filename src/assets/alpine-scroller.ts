import Alpine from "alpinejs";

Alpine.data("horizontalScroller", ({ scrollFull = false }: { scrollFull?: boolean } = {}) => ({
  overflowing: { left: false, right: true } as { left: boolean; right: boolean },
  scrollAmount: 0 as number,
  _cleanup: null as (() => void) | null,

  init() {
    const list = this.$refs.scroller as HTMLElement;
    if (!list) {
      return;
    }

    const firstItem = list.querySelector("li:first-child");
    const lastItem = list.querySelector("li:last-child");
    if (!firstItem || !lastItem) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const side = entry.target === firstItem ? "left" : "right";
          this.overflowing[side] = entry.intersectionRatio < 0.95;
        });
      },
      { root: list, threshold: 0.95 },
    );

    observer.observe(firstItem);
    observer.observe(lastItem);

    const inertObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0.5) {
            entry.target.removeAttribute("inert");
          } else {
            entry.target.setAttribute("inert", "inert");
          }
        });
      },
      { root: list, threshold: 0.5 },
    );

    list.querySelectorAll("li").forEach((item) => inertObserver.observe(item));

    this._cleanup = () => {
      observer.disconnect();
      inertObserver.disconnect();
    };

    this.scrollAmount = scrollFull ? list.offsetWidth : list.offsetWidth / 2;

    if (list.scrollLeft !== 0) {
      list.classList.remove("scroll-smooth");
      list.scrollLeft = 0;
      list.classList.add("scroll-smooth");
    }
  },

  destroy() {
    this._cleanup?.();
  },

  focusOnFirstItem() {
    setTimeout(() => {
      const list = this.$refs.scroller as HTMLElement;
      (list?.querySelectorAll("li[tabindex]:not([inert])")[0] as HTMLElement)?.focus({
        preventScroll: true,
      });
    }, 750);
  },

  scrollLeft() {
    (this.$refs.scroller as HTMLElement)?.scrollBy({
      left: -this.scrollAmount,
      behavior: "smooth",
    });

    this.focusOnFirstItem();
  },

  scrollRight() {
    (this.$refs.scroller as HTMLElement)?.scrollBy({
      left: this.scrollAmount,
      behavior: "smooth",
    });

    this.focusOnFirstItem();
  },
}));
