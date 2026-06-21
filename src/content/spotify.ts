import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } from "astro:env/server";
import { compact, sampleSize } from "es-toolkit";

const EXCLUDED_GENRES = ["modern alternative rock", "modern rock", "alternative rock"];

export const spotify = defineCollection({
  loader: async () => {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
      console.warn("Spotify: credentials not set, skipping fetch");
      return [];
    }

    try {
      // 1. Exchange refresh token for access token.
      const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
      });

      if (!tokenRes.ok) {
        console.error("Spotify token refresh failed:", await tokenRes.text());
        return [];
      }

      const { access_token } = (await tokenRes.json()) as {
        access_token: string;
      };

      const spotifyFetch = async (path: string) => {
        const res = await fetch(`https://api.spotify.com/v1${path}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!res.ok) {
          throw new Error(`Spotify API ${path} → ${res.status}`);
        }
        return res.json();
      };

      // 2. Fetch top 14 artists from the past ~4 weeks.
      const topArtistsData = (await spotifyFetch(
        "/me/top/artists?time_range=short_term&limit=14",
      )) as { items: SpotifyArtist[] };

      const topArtists = topArtistsData.items;

      // 3. Fetch the top track and audio features for every artist in parallel.
      //    Audio features are optional — Spotify deprecated this endpoint for apps
      //    created after Nov 2024, so errors are swallowed.
      const artists: SpotifyArtistWithTrack[] = await Promise.all(
        topArtists.map(async (artist) => {
          try {
            const data = (await spotifyFetch(`/artists/${artist.id}/top-tracks?market=GB`)) as {
              tracks: SpotifyTrack[];
            };
            const top_track = data.tracks[0] ?? null;
            if (top_track?.id) {
              try {
                const features = await spotifyFetch(`/audio-features/${top_track.id}`);
                (top_track as unknown as Record<string, unknown>).features = features;
              } catch {
                // silently skip — used only for BPM-driven card animation
              }
            }
            return { ...artist, top_track };
          } catch (err) {
            console.error(`top-tracks for ${artist.name}:`, err);
            return { ...artist, top_track: null };
          }
        }),
      );

      // 4. Pick one unique genre per artist, favouring the longest (most ridiculous) names.
      const usedGenres = [...EXCLUDED_GENRES];
      const artistGenres = compact(
        artists.map((artist) => {
          const sortedGenres = [...artist.genres].sort((a, b) => b.length - a.length);
          const genre = sortedGenres.find((g) => !usedGenres.includes(g));
          if (genre && genre.length > 4) {
            usedGenres.push(genre);
            return { artist: artist.name, genre };
          }
          return undefined;
        }),
      );

      const randomGenres = sampleSize(artistGenres, 6);

      console.log(`Spotify: ${artists.length} artists, ${randomGenres.length} genres`);

      return [{ id: "data", artists, randomGenres }];
    } catch (error) {
      console.error("Spotify fetch failed:", error);
      return [];
    }
  },
  schema: z.object({
    artists: z.array(z.unknown()),
    randomGenres: z.array(
      z.object({
        artist: z.string(),
        genre: z.string(),
      }),
    ),
  }),
});

// Minimal shapes — enough to drive the loader; expanded when building UI.
interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  popularity: number;
  followers: { total: number };
}

interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
}

interface SpotifyArtistWithTrack extends SpotifyArtist {
  top_track: SpotifyTrack | null;
}
