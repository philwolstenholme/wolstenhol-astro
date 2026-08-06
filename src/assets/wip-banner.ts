// Native onclick="" attributes are inline event handlers, which a strict
// Content-Security-Policy script-src blocks regardless of nonce/hash (those
// only cover <script> elements, not element attributes). Wiring the listener
// up here instead keeps the banner's dismiss behaviour CSP-compatible.
const banner = document.getElementById("wip-banner");
const closeButton = banner?.querySelector<HTMLButtonElement>("[data-wip-banner-close]");

closeButton?.addEventListener("click", () => {
  if (banner) {
    banner.style.display = "none";
  }
  document.cookie = `hideWipBanner=true; max-age=${60 * 60 * 24 * 5}; path=/`;
});
