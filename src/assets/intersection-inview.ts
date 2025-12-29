import { invariant } from "es-toolkit";

interface SectionDataset extends DOMStringMap {
  inView?: "true";
  inViewSkippedBecauseOfPagination?: "true";
}

const urlMayHavePaginationParams = (() => {
  const searchParams = new URLSearchParams(window.location.search);

  // Check for common pagination parameter names
  const paginationParams = ['page', 'p', 'offset', 'start'];

  for (const param of paginationParams) {
    const value = searchParams.get(param);
    if (value && /^\d{1,2}$/.test(value)) {
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

    // TODO: there must be a nicer way of doing this?
    // it's to allow one-time CSS animations.
    setTimeout(() => {
      if (!dataset.inViewPreviously) {
        dataset.inViewPreviously = "true";
      }
    }, 3000);
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
