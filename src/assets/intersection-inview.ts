import { invariant } from "es-toolkit";

interface SectionDataset extends DOMStringMap {
  inView?: "true";
  inViewSkippedBecauseOfPagination?: "true";
}

const urlMayHavePaginationParams = (() => {
  const searchParams = new URLSearchParams(window.location.search);

  for (const value of searchParams.values()) {
    // I don't want to maintain a list of all possible pagination param names,
    // so instead I just check for numeric 1-2 digit values. If any value looks
    // like a page number, assume pagination params are present.
    if (/^\d{1,2}$/.test(value)) {
      return true;
    }
  }

  return false;
})();

const handleIntersections = (entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry) => {
    invariant(entry.target instanceof HTMLElement, "Expected HTMLElement");
    const dataset = entry.target.dataset as SectionDataset;

    if (!entry.isIntersecting) {
      delete dataset.inView;
      return;
    }

    // We don't want animations to trigger if the user is paginating.
    // Skip setting `inView` once per section if pagination params exist.
    if (
      urlMayHavePaginationParams &&
      dataset.inViewSkippedBecauseOfPagination !== "true"
    ) {
      dataset.inViewSkippedBecauseOfPagination = "true";
      return;
    }

    dataset.inView = "true";
  });
};

const observer = new IntersectionObserver(handleIntersections, {
  threshold: 0.1,
});

function init() {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return;
  sections.forEach((section) => observer.observe(section));
}

init();
