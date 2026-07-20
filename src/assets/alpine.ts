// The CSP-safe build swaps Alpine's `new Function()`-based expression
// evaluator for a small hand-rolled parser, so script-src doesn't need
// 'unsafe-eval'. It only accepts a constrained expression grammar in
// directive attributes (see the individual component files for what that
// ruled out and why).
import Alpine from "@alpinejs/csp";
import focus from "@alpinejs/focus";
import AsyncAlpine from "async-alpine";

import footerLoadTime from "./alpine-footer-load-time";
import muteToggle from "./alpine-mute-toggle";
import spotifyGenrePill from "./alpine-spotify-genre-pill";
import themeToggle from "./alpine-theme-toggle";

Alpine.plugin(focus);
Alpine.plugin(AsyncAlpine);

// asyncData is added to Alpine by AsyncAlpine plugin at runtime
type AlpineWithAsync = typeof Alpine & {
  asyncData: (name: string, loader: () => Promise<unknown>) => void;
};
const A = Alpine as AlpineWithAsync;

A.asyncData("blueskyFeed", () => import("./alpine-bluesky"));
A.asyncData("pwContact", () => import("./alpine-contact"));
A.asyncData("githubCard", () => import("./alpine-github-card"));
A.asyncData("pwHeader", () => import("./alpine-header"));
A.asyncData("instagramCard", () => import("./alpine-instagram"));
A.asyncData("partyPopper", () => import("./alpine-party"));
A.asyncData("horizontalScroller", () => import("./alpine-scroller"));
A.asyncData("spotifyAudioController", () => import("./alpine-spotify"));

// Registered eagerly (not via asyncData/x-load) since these render
// above-the-fold on every page and are too small to be worth lazy-loading.
Alpine.data("footerLoadTime", footerLoadTime);
Alpine.data("muteToggle", muteToggle);
Alpine.data("spotifyGenrePill", spotifyGenrePill);
Alpine.data("themeToggle", themeToggle);

Alpine.start();
