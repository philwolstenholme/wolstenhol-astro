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
  for (const entry of entries) {
    invariant(entry.target instanceof HTMLElement, "Expected HTMLElement");
    const dataset = entry.target.dataset as SectionDataset;

    if (!entry.isIntersecting) {
      delete dataset.inView;
      continue;
    }

    // WE don't want animations to trigger if the user is paginating.
    // Use a data attribute to skip setting `inView` once per section
    // if we think there might be pagination params in the URL.
    if (
      urlMayHavePaginationParams &&
      dataset.inViewSkippedBecauseOfPagination !== "true"
    ) {
      dataset.inViewSkippedBecauseOfPagination = "true";
      continue;
    }

    dataset.inView = "true";
  }
};

(function init() {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(handleIntersections, {
    threshold: 0.1,
  });

  sections.forEach((section) => observer.observe(section));
})();
