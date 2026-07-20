import { cancel as cancelTimeago, render as renderTimeago } from "timeago.js";

import { defineComponent } from "./alpine-define";

const POLL_INTERVAL_MS = 30_000;
// Stop polling after this long so a page left open forever doesn't hit the API indefinitely.
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

type SpotifyLiveData =
  | Record<string, never>
  | {
      artistList: string;
      name: string;
      playedAt: string;
      trackUrl: string;
    };

const EMPTY_DATA: SpotifyLiveData = {};

export default defineComponent(() => ({
  _visibilityHandler: null as (() => void) | null,

  data: { ...EMPTY_DATA } as SpotifyLiveData,

  destroy() {
    this.stopInterval();
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
    }
  },

  init() {
    this.queryApi();

    this.$watch("data", () => {
      const label = this.$refs["label"] as HTMLElement | undefined;
      if (!label) return;

      if (label.getAttribute("timeago-id")) {
        cancelTimeago(label);
      }

      if ("playedAt" in this.data) {
        renderTimeago(label);
      }
    });

    this._visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        this.queryApi();
      }
    };
    document.addEventListener("visibilitychange", this._visibilityHandler);
  },

  async queryApi() {
    if (document.visibilityState !== "visible") return;

    let apiData: SpotifyLiveData = {};
    try {
      const response = await fetch("/api/recently-played-spotify");
      apiData = (await response.json()) as SpotifyLiveData;
    } catch (error) {
      console.error(error);
    }

    if (!("name" in apiData)) {
      this.data = { ...EMPTY_DATA };
      const label = this.$refs["label"] as HTMLElement | undefined;
      if (label) cancelTimeago(label);
      return;
    }

    this.data = apiData;
  },

  queryInterval: null as null | ReturnType<typeof setInterval>,
  queryTimeout: null as null | ReturnType<typeof setTimeout>,

  startInterval() {
    this.queryInterval = setInterval(() => this.queryApi(), POLL_INTERVAL_MS);
    this.queryTimeout = setTimeout(() => {
      if (this.queryInterval) clearInterval(this.queryInterval);
    }, POLL_TIMEOUT_MS);
  },

  stopInterval() {
    if (this.queryInterval) clearInterval(this.queryInterval);
    if (this.queryTimeout) clearTimeout(this.queryTimeout);
  },
}));
