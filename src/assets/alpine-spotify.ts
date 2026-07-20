import { DIGIT_KEYS } from "../helpers/digitKeys";
import { defineComponent } from "./alpine-define";

interface SpotifyArtist {
  top_track: null | { preview_url: null | string };
}

export default defineComponent(() => ({
  _artists: [] as SpotifyArtist[],
  _currentArtist: null as null | string,
  _currentTrack: null as null | string,
  _handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (this.playingUrl) this.stop();
      return;
    }
    if (!this.isKeyboardActive) return;
    const digit = DIGIT_KEYS.indexOf(e.key);
    if (digit === -1) return;
    const url = this._artists[digit]?.top_track?.preview_url;
    if (!url) return;
    if (this.playingUrl === url) {
      const audio = this.$refs["audio"] as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
    } else {
      this.play(url);
    }
  },
  _originalTitle: null as null | string,
  _playingProgress: null as HTMLProgressElement | null,
  async _restoreTitle() {
    const { stopRotatingTitle } = await import("../helpers/scrollingTitle");
    stopRotatingTitle();
    window.requestAnimationFrame(() => {
      document.title = this._originalTitle ?? document.title;
    });
  },

  async _setTitle() {
    if (!this._currentArtist || !this._currentTrack) return;

    const urlAtStart = this.playingUrl;

    const { rotateTitle, stopRotatingTitle } = await import("../helpers/scrollingTitle");
    if (this.playingUrl !== urlAtStart) return;
    stopRotatingTitle();

    const newTitle = `${this._currentArtist} - ${this._currentTrack}`;
    const prefix = "▶︎ ";
    document.title = prefix + newTitle;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    if (this.playingUrl !== urlAtStart) return;
    rotateTitle(newTitle, "-", 300, prefix);
  },

  _updateCards() {
    this._playingProgress = null;

    const audio = this.$refs["audio"] as HTMLAudioElement;
    if (audio) {
      if (this.playingUrl) {
        audio.src = this.playingUrl;
        audio.play().catch(console.error);
      } else {
        audio.pause();
        audio.src = "";
      }
    }

    document.querySelectorAll<HTMLElement>("[data-spotify-card]").forEach((card) => {
      const cardUrl = card.dataset.previewUrl;
      const isPlaying = !!cardUrl && cardUrl === this.playingUrl;

      if (isPlaying) {
        this._currentArtist = card.dataset.artist ?? null;
        this._currentTrack = card.dataset.track ?? null;
      }

      card.classList.toggle("card-music--playing", isPlaying);

      const btn = card.querySelector<HTMLElement>("[data-spotify-play-button]");
      if (btn) {
        btn.setAttribute("aria-pressed", String(isPlaying));
        const srOnly = btn.querySelector(".sr-only");
        if (srOnly) {
          srOnly.textContent = isPlaying
            ? `Pause preview of ${card.dataset.artist}`
            : `Play 30 second preview of ${card.dataset.artist}`;
        }
        btn.querySelector("[data-play-icon]")?.classList.toggle("hidden", isPlaying);
        btn.querySelector("[data-pause-icon]")?.classList.toggle("hidden", !isPlaying);
      }

      const video = card.querySelector<HTMLVideoElement>("[data-spotify-video]");
      if (video) {
        if (isPlaying) {
          video.removeAttribute("hidden");
          video.classList.replace("opacity-0", "opacity-40");
          video.play().catch(() => {});
        } else {
          video.pause();
          video.setAttribute("hidden", "");
          video.classList.replace("opacity-40", "opacity-0");
        }
      }

      const progress = card.querySelector<HTMLProgressElement>("[data-spotify-progress]");
      if (progress) {
        if (isPlaying) {
          progress.removeAttribute("hidden");
          progress.classList.add("card-music__progress--active");
          this._playingProgress = progress;
        } else {
          progress.setAttribute("hidden", "");
          progress.value = 0;
          progress.classList.remove("card-music__progress--active");
        }
      }
    });
  },

  init() {
    this._originalTitle = document.title;

    this._artists = JSON.parse(
      (this.$el as HTMLElement).dataset.artists || "[]",
    ) as SpotifyArtist[];

    const player = this.$el.closest("[data-spotify-player]") as HTMLElement | null;

    if (player) {
      player.addEventListener("spotify:play", (e: Event) => {
        const { url } = (e as CustomEvent<{ url: string }>).detail;
        if (!url) return;
        if (this.playingUrl === url) {
          this.stop();
        } else {
          this.play(url);
        }
      });

      player.addEventListener("mouseenter", () => {
        this.isKeyboardActive = true;
      });
      player.addEventListener("mouseleave", () => {
        if (!player.contains(document.activeElement)) {
          this.isKeyboardActive = false;
        }
      });
      player.addEventListener("focusin", () => {
        this.isKeyboardActive = true;
      });
      player.addEventListener("focusout", (e: Event) => {
        if (!player.contains((e as FocusEvent).relatedTarget as Node)) {
          this.isKeyboardActive = false;
        }
      });
    }

    document.addEventListener("keydown", (e: KeyboardEvent) => this._handleKey(e));

    const audio = this.$refs["audio"] as HTMLAudioElement;
    if (audio) {
      audio.addEventListener("timeupdate", () => {
        if (!audio.duration || !this._playingProgress) return;
        this._playingProgress.value = audio.currentTime / audio.duration;
      });
      audio.addEventListener("ended", () => this.stop());
      audio.addEventListener("playing", () => this._setTitle());
    }

    this.$watch("playingUrl", () => {
      this._updateCards();
      if (!this.playingUrl) {
        this._restoreTitle();
      }
    });
    this.$watch("isKeyboardActive", () => {
      const player = this.$el.closest("[data-spotify-player]") as HTMLElement | null;
      player?.classList.toggle("keyboard-active", this.isKeyboardActive);
    });
  },

  isKeyboardActive: false,

  play(url: string) {
    this.playingUrl = url;
  },

  playingUrl: null as null | string,

  stop() {
    this.playingUrl = null;
  },
}));
