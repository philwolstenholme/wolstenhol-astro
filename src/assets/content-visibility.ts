const eqIsh = (a: number, b: number, fuzz = 2) => Math.abs(a - b) <= fuzz;

const rectNotEQ = (a: DOMRectReadOnly | DOMRect, b: DOMRectReadOnly | DOMRect) =>
  !eqIsh(a.width, b.width) || !eqIsh(a.height, b.height);

const spaced = new WeakMap<Element, DOMRectReadOnly | DOMRect>();

const reserveSpace = (el: Element, rect: DOMRectReadOnly | DOMRect) => {
  const old = spaced.get(el);
  if (!old || rectNotEQ(old, rect)) {
    spaced.set(el, rect);
    (el as HTMLElement).style.setProperty(
      "contain-intrinsic-size",
      `${rect.width}px ${rect.height}px`,
    );
  }
};

const iObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      reserveSpace(entry.target, entry.boundingClientRect);
    });
  },
  { rootMargin: "500px 0px 500px 0px" },
);

const rObs = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    reserveSpace(entry.target, entry.contentRect);
  });
});

const sections = document.querySelectorAll("main section");

if (sections.length) {
  sections.forEach((el) => {
    iObs.observe(el);
    rObs.observe(el);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      (sections[0] as HTMLElement).style.setProperty("contain-intrinsic-size", "auto");
    });
  });
}
