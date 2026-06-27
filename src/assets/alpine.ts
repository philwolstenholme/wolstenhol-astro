import focus from "@alpinejs/focus";
import Alpine from "alpinejs";
import AsyncAlpine from "async-alpine";

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
A.asyncData("horizontalScroller", () => import("./alpine-scroller"));
A.asyncData("spotifyAudioController", () => import("./alpine-spotify"));

Alpine.start();
