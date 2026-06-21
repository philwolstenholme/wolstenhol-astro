import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  top_track: {
    id: string;
    name: string;
    preview_url: string | null;
    album: { name: string; images: { url: string; width: number; height: number }[] };
    features?: { tempo: number };
  } | null;
}

const DIGIT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface Props {
  artists: SpotifyArtist[];
}

export function SpotifyAudioController({ artists }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingProgressRef = useRef<HTMLProgressElement | null>(null);

  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const playingUrlRef = useRef<string | null>(null);
  const isKeyboardActiveRef = useRef(false);

  useEffect(() => {
    playingUrlRef.current = playingUrl;
  }, [playingUrl]);

  useEffect(() => {
    isKeyboardActiveRef.current = isKeyboardActive;
  }, [isKeyboardActive]);

  const playerEl = useCallback(
    () => rootRef.current?.closest<HTMLElement>("[data-spotify-player]") ?? null,
    [],
  );

  const cards = useCallback(
    () => document.querySelectorAll<HTMLElement>("[data-spotify-card]"),
    [],
  );

  const stop = useCallback(() => setPlayingUrl(null), []);

  const play = useCallback((url: string) => setPlayingUrl(url), []);

  // Drive the <audio> element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingUrl) {
      audio.src = playingUrl;
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [playingUrl]);

  // Update all card DOM when playing state changes
  useEffect(() => {
    playingProgressRef.current = null;

    cards().forEach((card) => {
      const cardUrl = card.dataset.previewUrl;
      const isPlaying = !!cardUrl && cardUrl === playingUrl;

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
          playingProgressRef.current = progress;
        } else {
          progress.setAttribute("hidden", "");
          progress.value = 0;
          progress.classList.remove("card-music__progress--active");
        }
      }
    });
  }, [playingUrl, cards]);

  // keyboard-active class on the player container
  useEffect(() => {
    playerEl()?.classList.toggle("keyboard-active", isKeyboardActive);
  }, [isKeyboardActive, playerEl]);

  // Click delegation on the player container
  useEffect(() => {
    const player = playerEl();
    if (!player) return;

    const handleClick = (e: Event) => {
      const btn = (e.target as Element).closest("[data-spotify-play-button]");
      if (!btn) return;
      e.preventDefault();
      const url = btn.closest<HTMLElement>("[data-spotify-card]")?.dataset.previewUrl;
      if (!url) return;
      if (playingUrlRef.current === url) {
        stop();
      } else {
        play(url);
      }
    };

    player.addEventListener("click", handleClick);
    return () => player.removeEventListener("click", handleClick);
  }, [playerEl, play, stop]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (playingUrlRef.current) stop();
        return;
      }
      if (!isKeyboardActiveRef.current) return;
      const digit = DIGIT_KEYS.indexOf(e.key);
      if (digit === -1) return;
      const url = artists[digit]?.top_track?.preview_url;
      if (!url) return;
      if (playingUrlRef.current === url) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }
      } else {
        play(url);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [artists, play, stop]);

  // Mouse/focus tracking for keyboard shortcut mode
  useEffect(() => {
    const player = playerEl();
    if (!player) return;

    const onEnter = () => setIsKeyboardActive(true);
    const onLeave = () => {
      if (!player.contains(document.activeElement)) setIsKeyboardActive(false);
    };
    const onFocusIn = () => setIsKeyboardActive(true);
    const onFocusOut = (e: FocusEvent) => {
      if (!player.contains(e.relatedTarget as Node)) setIsKeyboardActive(false);
    };

    player.addEventListener("mouseenter", onEnter);
    player.addEventListener("mouseleave", onLeave);
    player.addEventListener("focusin", onFocusIn);
    player.addEventListener("focusout", onFocusOut);
    return () => {
      player.removeEventListener("mouseenter", onEnter);
      player.removeEventListener("mouseleave", onLeave);
      player.removeEventListener("focusin", onFocusIn);
      player.removeEventListener("focusout", onFocusOut);
    };
  }, [playerEl]);

  const handleTimeUpdate = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    if (!audio.duration || !playingProgressRef.current) return;
    playingProgressRef.current.value = audio.currentTime / audio.duration;
  }, []);

  return (
    <div ref={rootRef} class="contents">
      <audio ref={audioRef} class="sr-only" onTimeUpdate={handleTimeUpdate} onEnded={stop} />
      <iframe
        class="absolute right-0 bottom-0 h-20 w-36"
        name="spotify-preview"
        title="Spotify preview"
        aria-hidden="true"
      />
    </div>
  );
}
