import { invariant } from "es-toolkit";

interface SectionDataset extends DOMStringMap {
  inView?: "true";
  inViewSkippedBecauseOfPagination?: "true";
}

const mayHavePaginationParams = (() => {
  const searchParams = new URLSearchParams(window.location.search);

  for (const value of searchParams.values()) {
    // Only digits, and length 1–2.
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

    if (mayHavePaginationParams) {
      dataset.inViewSkippedBecauseOfPagination = "true";
    } else {
      dataset.inView = "true";
    }
  });
};

(function init() {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(handleIntersections, {
    threshold: 0.1,
  });

  sections.forEach((section) => observer.observe(section));
})();
