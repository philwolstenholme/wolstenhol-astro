// Content of every script/style that MUST render inline (i.e. can't be
// deferred to a bundled file without reintroducing a flash of the wrong
// theme, or without losing the "run before first paint" guarantee).
// Exported as constants so the exact same string is both rendered into the
// page AND hashed for the Content-Security-Policy header in
// src/middleware.ts — a single source of truth so the CSP hash can never
// drift out of sync with what's actually rendered.

export const THEME_INIT_SCRIPT = `(() => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const stored = localStorage.getItem("theme");
    document.documentElement.dataset.theme =
      stored === "dark" || stored === "light"
        ? stored
        : mq.matches
          ? "dark"
          : "light";
  };
  apply();
  mq.addEventListener("change", apply);
  window.addEventListener("pageshow", apply);
  document.addEventListener("prerenderingchange", apply);
  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      apply();
    }
  });
})();`;

// Vendored minified snippet (see Layout.astro for provenance) that records
// viewport/device capabilities as CSS custom properties before first paint.
export const DEVICE_CAPABILITIES_SCRIPT = `/* oxlint-disable no-unused-expressions -- vendored minified snippet */
(function () {
  "use strict";
  var o = {
    constPrefix: "--const-",
    root: typeof document < "u" ? document.documentElement : void 0,
  };
  function s() {
    let e = document.createElement("div"),
      i = o.root,
      t = (n, r) => i.style.setProperty(o.constPrefix + n, String(r));
    ((e.style.cssText =
      "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden"),
      (document.body ?? i).appendChild(e),
      t("scrollbar-w", e.offsetWidth - e.clientWidth),
      (e.style.scrollbarWidth = "thin"),
      t("scrollbar-thin-w", e.offsetWidth - e.clientWidth),
      e.remove(),
      t("dpr", window.devicePixelRatio || 1),
      t("cores", navigator.hardwareConcurrency || 0),
      t("mem", navigator.deviceMemory || 0));
  }
  typeof document < "u" && s();
})();`;

// Restores the header nav's horizontal scroll position before first paint
// (see Header.astro for the full rationale).
export const NAV_SCROLL_RESTORE_SCRIPT = `(() => {
  const STORAGE_KEY = "header-nav-scroll-x";
  const nav = document.querySelector(".header-nav");
  if (!nav) {
    return;
  }

  const restore = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const x = stored === null ? NaN : Number(stored);
    if (Number.isFinite(x)) {
      nav.scrollLeft = x;
    }
  };

  restore();

  let persistQueued = false;
  const persist = () => {
    persistQueued = false;
    sessionStorage.setItem(STORAGE_KEY, String(nav.scrollLeft));
  };
  nav.addEventListener(
    "scroll",
    () => {
      if (persistQueued) {
        return;
      }
      persistQueued = true;
      requestAnimationFrame(persist);
    },
    { passive: true },
  );
  nav.addEventListener("scrollend", persist);

  window.addEventListener("pageshow", restore);
  document.addEventListener("prerenderingchange", restore);
})();`;

// Prerender candidate rules for same-origin navigations. Speculation rules
// must be served as application/speculationrules+json when external, which
// static hosts don't set by default — kept inline (and hashed) instead.
export const SPECULATION_RULES_SCRIPT = `{
  "prerender": [
    {
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "selector_matches": ".no-prerender" } },
          { "not": { "selector_matches": "[rel~=nofollow]" } }
        ]
      },
      "eagerness": "eager"
    }
  ]
}`;

// Fallback styling for the no-JS content-visibility reset in Layout.astro's
// <noscript>. CSP still governs <style> elements that only render when
// scripting is disabled, so this needs a hash too.
export const NOSCRIPT_STYLE = `
  main section + section,
  main .card--portfolio + .card--portfolio {
    contain-intrinsic-size: unset;
    content-visibility: unset;
  }
`;
