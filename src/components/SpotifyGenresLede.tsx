interface Genre {
  artist: string;
  genre: string;
}

const listFormatter = new Intl.ListFormat("en-US", { type: "conjunction" });

export function SpotifyGenresLede({ genres }: { genres: Genre[] }) {
  const byGenreName = Object.fromEntries(genres.map((g) => [g.genre, g]));
  const parts = listFormatter.formatToParts(genres.map((g) => g.genre));

  return (
    <p class="mt-3 max-w-3xl font-serif leading-relaxed tracking-widest select-none">
      According to the Spotify API, I've been listening to a bit of{" "}
      {parts.map((part) => {
        if (part.type === "literal") {
          return part.value;
        }

        const g = byGenreName[part.value];

        return (
          <mark
            class="cursor-help"
            tabIndex={0}
            title={g.artist}
            {...{
              "x-data": "{ open: false }",
              "@focus": "open = true; $dispatch('play-sound', 'slide')",
              "@blur": "open = false",
              "@click": "open = !open; $dispatch('play-sound', 'slide')",
            }}
          >
            {g.genre}
            <span x-show="open" x-cloak>
              {" "}
              ({g.artist})
            </span>
          </mark>
        );
      })}{" "}
      over the last few weeks. Spotify used to show really fun genre names here, but they removed
      the human-curated genre names from the API responses 😔
    </p>
  );
}
