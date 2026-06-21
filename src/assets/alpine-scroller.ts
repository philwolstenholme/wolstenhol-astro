import Alpine from "alpinejs";

Alpine.data("horizontalScroller", ({ scrollFull = false }: { scrollFull?: boolean } = {}) => ({
  overflowing: { left: false, right: true } as { left: boolean; right: boolean },
  scrollAmount: 0 as number,
  _cleanup: null as (() => void) | null,

  init() {
    const list = this.$refs.scroller as HTMLElement;
    if (!list) return;

    const firstItem = list.querySelector("li:first-child");
    const lastItem = list.querySelector("li:last-child");
    if (!firstItem || !lastItem) return;

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
    this._cleanup = () => observer.disconnect();

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

  scrollLeft() {
    (this.$refs.scroller as HTMLElement)?.scrollBy({
      left: -this.scrollAmount,
      behavior: "smooth",
    });
  },

  scrollRight() {
    (this.$refs.scroller as HTMLElement)?.scrollBy({
      left: this.scrollAmount,
      behavior: "smooth",
    });
  },
}));
