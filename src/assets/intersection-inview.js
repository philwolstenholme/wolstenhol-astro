// src/assets/intersection-inview.js
// Minimal intersection observer for adding/removing 'in-view' class to <section> elements

(function () {
  const sections = document.querySelectorAll("section");
  if (!sections.length) {
    return;
  }

  const observer = new window.IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.inView = "true";
        } else {
          delete entry.target.dataset.inView;
        }
      });
    },
    { threshold: 0.1 },
  );
  sections.forEach((section) => observer.observe(section));
})();
