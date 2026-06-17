interface Genre {
  artist: string;
  genre: string;
}

const listFormatter = new Intl.ListFormat("en-US", { type: "conjunction" });

export function SpotifyGenresLede({ genres }: { genres: Genre[] }) {
  const byGenreName = Object.fromEntries(genres.map((g) => [g.genre, g]));
  const parts = listFormatter.formatToParts(genres.map((g) => g.genre));

  return (
    <p class="mt-3 max-w-3xl font-serif leading-relaxed tracking-widest">
      According to the Spotify API, I've been listening to a bit of{" "}
      {parts.map((part) => {
        if (part.type === "literal") {
          return part.value;
        }
        const g = byGenreName[part.value];
        return (
          <mark
            class="group cursor-help"
            tabIndex={0}
            title={g.artist}
            {...{
              "x-data": "{ open: false }",
              "@blur": "open = false",
              "@click":
                "const p = $el.closest('p'); p && (p.classList.add('select-none'), setTimeout(() => p.classList.remove('select-none'), 1000)); open ? $el.blur() : void 0; open = !open",
            }}
          >
            {g.genre}
            <span class="hidden group-focus:inline"> ({g.artist})</span>
          </mark>
        );
      })}{" "}
      over the last few weeks. Spotify used to show really fun genre names here, but they removed
      the human-curated genre names from the API responses 😔
    </p>
  );
}
