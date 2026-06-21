import clsx from "clsx";
import { useState, useEffect, useRef } from "preact/hooks";

interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  album: { name: string; images: SpotifyImage[] };
  features?: { tempo: number };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  top_track: SpotifyTrack | null;
}

const DIGIT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function cloudinaryUrl(spotifyUrl: string, size = 145): string {
  return spotifyUrl.replace(
    "https://i.scdn.co/image/",
    `https://wolstenhol.me/proxy/cloudinary/image/upload/w_${size},h_${size},c_fill,f_auto,q_auto:low/spotify/`,
  );
}

interface MusicCardProps {
  artist: SpotifyArtist;
  index: number;
  isPlaying: boolean;
  anyPlaying: boolean;
  progress: number;
  onPlay: () => void;
  onStop: () => void;
  keyHint?: string;
}

function MusicCard({
  artist,
  index,
  isPlaying,
  anyPlaying,
  progress,
  onPlay,
  onStop,
  keyHint,
}: MusicCardProps) {
  const playButtonRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const bpm = artist.top_track?.features?.tempo ?? 0;
  const tempoAnimationDuration = bpm > 0 ? 1 / (bpm / 60) / 2 : undefined;

  const imageUrl = artist.images[0] ? cloudinaryUrl(artist.images[0].url) : "";
  const imageUrl2x = artist.images[0] ? cloudinaryUrl(artist.images[0].url, 290) : "";
  const previewUrl = artist.top_track?.preview_url ?? null;

  // Show/hide the static-noise video when this card starts or stops playing.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (isPlaying) {
      video.removeAttribute("hidden");
      video.play().catch(() => {});
    } else {
      video.pause();
      video.setAttribute("hidden", "");
    }
  }, [isPlaying]);

  const handlePress = (e: Event) => {
    e.preventDefault();
    playButtonRef.current?.setAttribute("aria-pressed", String(!isPlaying));
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <article
      data-index={index}
      data-preview-url={previewUrl ?? ""}
      data-artist={artist.name}
      data-track={artist.top_track?.name ?? ""}
      style={
        tempoAnimationDuration ? { animationDuration: `${tempoAnimationDuration}s` } : undefined
      }
      class={clsx(
        "card-music contain-content group/card relative flex w-full select-none overflow-hidden rounded bg-linear-to-b from-spotify to-black shadow-hard",
        isPlaying && "card-music--playing",
      )}
    >
      <h3 class="sr-only">{artist.name}</h3>

      {keyHint && (
        <div
          aria-hidden="true"
          class="absolute top-2 right-2 z-10 hidden h-5 w-5 items-center justify-center rounded border border-yellow-300/60 text-xs font-bold text-yellow-300 opacity-0 transition-opacity duration-150 group-[.keyboard-active]/player:opacity-100 pointer-fine:flex"
        >
          {keyHint}
        </div>
      )}

      <figure>
        <img
          src={imageUrl}
          srcSet={`${imageUrl2x} 2x`}
          alt={artist.name}
          class="card-music__image mix-blend-soft-light transition-all"
          loading="lazy"
          crossOrigin="anonymous"
          width={145}
          height={145}
        />
        <figcaption class="sr-only">{artist.name}</figcaption>
      </figure>

      {previewUrl && (
        <a
          ref={playButtonRef}
          href={previewUrl}
          target="spotify-preview"
          class="outline-offset-invert group absolute inset-0 text-yellow-300"
          role="button"
          aria-pressed={isPlaying}
          onClick={handlePress}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              handlePress(e);
            }
          }}
        >
          <div class="absolute top-0 left-0 z-10 p-2">
            <span class="sr-only">
              {isPlaying
                ? `Pause preview of ${artist.name}`
                : `Play 30 second preview of ${artist.name}`}
            </span>
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </div>

          {/* Static-noise video — visible at 40% on non-playing cards while
              something else plays; hidden on this card and when nothing plays.
              mix-blend-luminosity adds grain texture without tinting colour. */}
          <video
            ref={videoRef}
            aria-hidden="true"
            hidden
            class={clsx(
              "pointer-events-none absolute block h-full w-full object-cover object-top-left mix-blend-luminosity transition-opacity motion-reduce:hidden",
              isPlaying || anyPlaying ? "opacity-40" : "opacity-0",
            )}
            loop
            autoPlay
            muted
            playsInline
            preload="none"
          >
            <source
              src="https://wolstenhol.me/proxy/cloudinary/video/upload/v1650231745/11ty/static.mp4"
              type="video/mp4"
            />
          </video>
        </a>
      )}

      <div class="absolute bottom-0 left-0 z-10 block p-2 text-xs font-bold">
        <div class="card-music__caption group-hocus/card:-translate-y-1 relative inline-block transform-gpu p-1 px-2 text-yellow-300 transition-transform duration-75">
          <span class="relative z-10 text-black">{artist.name}</span>
        </div>
      </div>

      {previewUrl && (
        <progress
          value={isPlaying ? progress : 0}
          max={1}
          hidden={!isPlaying}
          class={clsx(
            "card-music__progress absolute bottom-0 w-full text-spotify",
            isPlaying && "card-music__progress--active",
          )}
        />
      )}
    </article>
  );
}

interface Props {
  artists: SpotifyArtist[];
}

export function SpotifyMusicPlayer({ artists }: Props) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const scrollAmountRef = useRef(0);
  const [overflowing, setOverflowing] = useState({ left: false, right: true });
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const playingUrlRef = useRef(playingUrl);
  useEffect(() => {
    playingUrlRef.current = playingUrl;
  }, [playingUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (playingUrl) {
      audio.src = playingUrl;
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.src = "";
      setProgress(0);
    }
  }, [playingUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && playingUrlRef.current) {
        setPlayingUrl(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!isKeyboardActive) return;
    const handler = (e: KeyboardEvent) => {
      const digit = DIGIT_KEYS.indexOf(e.key);
      if (digit === -1) return;
      const artist = artists[digit];
      if (!artist?.top_track?.preview_url) return;
      const url = artist.top_track.preview_url;
      if (playingUrlRef.current === url) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }
      } else {
        setPlayingUrl(url);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isKeyboardActive, artists]);

  // ── Scroller: overflow detection + initial-scroll correction ─────────────
  // Matches PwSimpleScroller.js exactly.

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    // scrollFull: true → scroll amount is the full scroller width
    scrollAmountRef.current = scroller.offsetWidth;

    const firstItem = scroller.querySelector("li:first-child");
    const lastItem = scroller.querySelector("li:last-child");
    if (!firstItem || !lastItem) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const side = entry.target === firstItem ? "left" : "right";
          setOverflowing((prev) => ({
            ...prev,
            [side]: entry.intersectionRatio < 0.95,
          }));
        });
      },
      { root: scroller, threshold: 0.95 },
    );
    observer.observe(firstItem);
    observer.observe(lastItem);

    // Reset any browser-pre-scrolled position (rare but possible)
    if (scroller.scrollLeft !== 0) {
      scroller.classList.remove("scroll-smooth");
      scroller.scrollLeft = 0;
      scroller.classList.add("scroll-smooth");
    }

    return () => observer.disconnect();
  }, []);

  const scrollLeft = () =>
    scrollerRef.current?.scrollBy({
      left: -scrollAmountRef.current,
      behavior: "smooth",
    });

  const scrollRight = () =>
    scrollerRef.current?.scrollBy({
      left: scrollAmountRef.current,
      behavior: "smooth",
    });

  const handleTimeUpdate = (e: Event) => {
    const audio = e.target as HTMLAudioElement;
    if (!audio.duration) {
      return;
    }

    setProgress(Math.round((audio.currentTime / audio.duration + Number.EPSILON) * 100) / 100);
  };

  const arrowLeft =
    "M42.2453804.060926c1.632069-.21162 2.346698.0963 3.468039 1.42679.794909.94007.955069 1.31177 1.084209 2.55564.217541 2.55051-1.165629 5.33305-3.62287 7.26193-1.702211 1.28149-1.82612 1.33488-5.60298895 2.27293-3.18713105.78566-3.73999105.98432-3.14150905 1.12759 1.222878.28105 4.408749.25306 9.049419-.0571 2.07917-.1444 5.3889486-.22578 7.2626906-.19126a67.997917 67.997917 0 005.074518-.0507c.746641-.0505 1.914491-.0282 5.351431.10679a828.41042 828.41042 0 0010.20015.26635 25.664583 25.664583 0 012.75304.22629 16.66875 16.66875 0 002.5185.14093c.643141-.0285 1.219621.0113 1.356151.14452.105148.1129.46359.1449.800018.0734.336441-.0715.694891-.0395.831432.0938.0997.087.58361.20055 1.065959.17917 1.43765.019 2.97983.52974 3.507181 1.22913.28956.34419.753528 1.38165 1.034698 2.3227.549762 1.69547.555252 1.72136-.209428 3.72326-.915072 2.4396-1.544571 3.16849-3.597481 4.199951a12.435417 12.435417 0 01-7.227049.995169 263.8425 263.8425 0 00-23.38465-.57458 134.14375 134.14375 0 00-10.7646306.259379 105.80687 105.80687 0 01-5.13402.279792l-3.21564.14252c-3.102729.0374-3.851651.331799-2.69053 1.085829a12.329583 12.329583 0 002.4691 2.071921 11.1125 11.1125 0 011.954379 1.559189c.0276.1294.565862.880541 1.18736 1.641092 1.359141 1.685708 1.92662205 2.701149 1.706322 2.93733-.118401.0793-.180171.552219-.190162 1.014198.0158.45647-.299831 1.389142-.676021 2.037162-.396589.679368-.669258 1.305377-.647258 1.408898.055.258792-1.818611 2.388219-2.784559 3.188621-1.284261 1.084461-3.468561 1.11596-4.9858624.086a1.0583333 1.0583333 0 00-1.178869-.074c-.608491.31869-2.37584-.36059-4.85883-1.861511-1.144601-.676388-1.635691-.950687-5.154891-2.745308-3.75923-1.905889-8.428899-5.295339-9.721399-7.049299a11.377083 11.377083 0 00-.92043-1.021592c-.35232-.38495-.84667-.929061-1.07896-1.25839-.70788-1.039702-1.287-1.728081-1.90687-2.35372-.33581-.307311-.67488-.88441-.74638-1.220862-.077-.362328-.26303-.728527-.43485-.773157-.1459-.0502-.48334-.492352-.71726-.956562-.36657-.70652-.41378-1.18338-.19553-2.44699.48961-3.2959 1.70523-5.33955 4.82172-8.11185 4.70809-4.19255 7.858599-6.29584 11.479199-7.71461l2.866191-1.15021 3.38381-1.26024a233.33604 233.33604 0 005.6910104-1.85886c2.093039-.71538 12.027771-3.09756 13.87239-3.32736";
  const arrowRight =
    "M38.1641.04794c-1.64041.13229-2.275409.58208-3.09562 2.11666-.582078 1.08479-.661458 1.48167-.529169 2.72521.3175 2.54 2.248959 4.97417 5.053539 6.35 1.93146.89958 2.06375.92604 5.95313 1.05833 3.28083.10584 3.86291.18521 3.30729.4498-1.13771.52916-4.25979 1.16416-8.86354 1.82562-2.06375.29104-5.31813.89958-7.14375 1.32292a67.997917 67.997917 0 01-4.974169 1.00541c-.740831.10584-1.87854.37042-5.21229 1.21709a828.41042 828.41042 0 01-9.921881 2.38125 25.664583 25.664583 0 00-2.645829.79375 16.66875 16.66875 0 01-2.43416.66146c-.63501.10583-1.19063.26458-1.29646.42333-.0794.13229-.423341.23812-.76729.23812-.34396 0-.687921.10584-.79376.26459-.0794.10583-.529161.3175-1.005411.39687-1.402289.3175-2.804589 1.13771-3.174999 1.93146-.21167.39687-.44979 1.50813-.52917 2.48708-.18521 1.77271-.18521 1.79917.97896 3.59834 1.40229 2.19604 2.169579 2.77812 4.392079 3.36021a12.435417 12.435417 0 007.27604-.52917 263.8425 263.8425 0 0122.754171-5.42396 134.14375 134.14375 0 0110.583329-1.98437 105.80687 105.80687 0 005.08-.79375l3.175-.52917c3.04271-.60854 3.83646-.47625 2.8575.50271a12.329583 12.329583 0 01-1.98437 2.54 11.1125 11.1125 0 00-1.5875 1.93145c0 .1323-.37042.97896-.82021 1.85209-.97896 1.93146-1.32292 3.04271-1.05833 3.22792.13229.0529.29104.5027.39687.95249.0794.4498.58209 1.29646 1.08479 1.85209.52917.58208.92605 1.13771.92605 1.24354 0 .26458 2.27541 1.95792 3.38666 2.54 1.48167.79375 3.62479.37042 4.89479-.9525a1.0583333 1.0583333 0 011.13771-.3175c.66146.18521 2.24896-.84667 4.36563-2.83104.97896-.89959 1.40229-1.27 4.47146-3.75709 3.28083-2.64583 7.14375-6.93208 8.04333-8.91645a11.377083 11.377083 0 01.68792-1.19063c.26458-.44979.635-1.08479.79375-1.45521.47625-1.16416.89958-1.95791 1.37583-2.69875.26458-.37041.47625-1.00541.47625-1.34937 0-.37042.10583-.76729.26458-.84667.13229-.0794.37042-.58208.50271-1.08479.21167-.76729.15875-1.24354-.3175-2.43417-1.16416-3.12208-2.77812-4.86833-6.40291-6.93208-5.47688-3.12208-8.99584-4.52438-12.8323-5.15938l-3.0427-.52916-3.57188-.52917a233.33604 233.33604 0 01-5.95312-.635C50.2291.15377 40.01619-.11082 38.1641.04793";

  return (
    <div
      class={clsx("group/player relative mt-12", isKeyboardActive && "keyboard-active")}
      onMouseEnter={() => setIsKeyboardActive(true)}
      onMouseLeave={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) {
          setIsKeyboardActive(false);
        }
      }}
      onFocus={() => setIsKeyboardActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsKeyboardActive(false);
        }
      }}
    >
      <button
        type="button"
        inert={!overflowing.left ? true : undefined}
        class={clsx(
          "group absolute -left-12 bottom-5 top-0 hidden w-8 translate-x-12 transform-gpu transition-all md:block",
          "text-green-700 hocus:text-green-800",
          !overflowing.left && "pointer-events-none opacity-0 translate-x-12",
        )}
        onClick={scrollLeft}
      >
        <span class="sr-only">Back</span>
        <svg
          class="group-hocus:rotate-6 rotate-3 transform-gpu"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 84.663887 42.437332"
          focusable="false"
          role="presentation"
        >
          <path class="fill-current" d={arrowLeft} />
        </svg>
      </button>
      {/* ── Scroller ── */}
      <div class="relative overflow-x-hidden">
        {/* Left shadow affordance */}
        <div
          class={clsx(
            "scroller-affordance pointer-events-none absolute bottom-5 left-0 top-0 z-10 w-3 rotate-180 transform-gpu transition-transform",
            !overflowing.left && "-translate-x-3",
          )}
        />

        <ul
          ref={scrollerRef}
          role="list"
          aria-label="What I've been listening to"
          class="relative flex snap-x snap-mandatory space-x-5 overflow-x-auto overscroll-x-none scroll-smooth"
          onScroll={() => scrollerRef.current?.classList.remove("scroller--no-interaction")}
          onMouseEnter={() => scrollerRef.current?.classList.remove("scroller--no-interaction")}
        >
          {artists.map((artist, i) => (
            <li key={artist.id} tabIndex={-1} class="relative mb-3 shrink-0 grow-0 snap-center">
              <MusicCard
                artist={artist}
                index={i}
                isPlaying={playingUrl !== null && playingUrl === artist.top_track?.preview_url}
                anyPlaying={playingUrl !== null}
                progress={progress}
                onPlay={() => {
                  const url = artist.top_track?.preview_url;
                  if (url) {
                    setPlayingUrl(url);
                  }
                }}
                onStop={() => setPlayingUrl(null)}
                keyHint={DIGIT_KEYS[i]}
              />
            </li>
          ))}
        </ul>

        {/* Right shadow affordance */}
        <div
          class={clsx(
            "scroller-affordance pointer-events-none absolute bottom-5 right-0 top-0 z-10 w-3 transform-gpu transition-transform",
            !overflowing.right && "translate-x-3",
          )}
        />
      </div>
      {/* ── Right nav button ── */}
      <button
        type="button"
        inert={!overflowing.right ? true : undefined}
        class={clsx(
          "group absolute -right-12 bottom-5 top-0 hidden w-8 -translate-x-12 transform-gpu transition-all md:block",
          "text-green-700 hocus:text-green-800",
          !overflowing.right && "pointer-events-none opacity-0 -translate-x-12",
        )}
        onClick={scrollRight}
      >
        <span class="sr-only">Forward</span>
        <svg
          class="group-hocus:-rotate-6 -rotate-3 transform-gpu"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 84.663887 42.437332"
          focusable="false"
          role="presentation"
        >
          <path class="fill-current" d={arrowRight} />
        </svg>
      </button>
      <div class="flex h-10 justify-end">
        <div
          class={clsx(
            "ml-3 mt-3 transform-gpu rounded text-sm font-bold text-gray-600 transition-all duration-300",
            !overflowing.right && "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          <span>There&rsquo;s more!</span>
          <button
            type="button"
            class="shadow-hard hocus:bg-green-600 ml-1 rounded bg-green-700 px-2 py-1 font-bold text-white transition-colors"
            onClick={scrollRight}
          >
            scroll this way <span aria-hidden="true">➜</span>
          </button>
        </div>
      </div>
      <p class="mt-4 max-w-prose text-xs font-bold opacity-90">
        You can click the cards above to play a little preview of the artist, courtesy of the
        Spotify API. I also use the Spotify API to get the tempo/BPM of the preview song, and I use
        this to influence the speed that a card bops at while it&rsquo;s playing.
      </p>
      <p class="mt-2 hidden pb-0.5 text-xs opacity-90 pointer-fine:block">
        Press the pause icon or the{" "}
        <kbd class="rounded border border-gray-300 bg-white p-0.5">esc</kbd> key to stop. Hover or
        focus this section, then press{" "}
        <kbd class="rounded border border-gray-300 bg-white p-0.5">1</kbd>–
        <kbd class="rounded border border-gray-300 bg-white p-0.5">9</kbd> or{" "}
        <kbd class="rounded border border-gray-300 bg-white p-0.5">0</kbd> to play each artist.
      </p>
      <audio
        ref={audioRef}
        class="sr-only"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlayingUrl(null)}
      />
      <iframe
        class="absolute right-0 bottom-0 h-20 w-36"
        name="spotify-preview"
        title="Spotify preview"
        aria-hidden="true"
      />
    </div>
  );
}
