import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { compact, sampleSize } from "es-toolkit";

import { getSpotifyAccessToken, spotifyFetch } from "../helpers/spotifyAuth";

const EXCLUDED_GENRES = ["modern alternative rock", "modern rock", "alternative rock"];

export const spotify = defineCollection({
  loader: async () => {
    const accessToken = await getSpotifyAccessToken();

    if (!accessToken) {
      console.warn("Spotify: credentials not set, skipping fetch");
      return [];
    }

    try {
      // Fetch top 14 artists from the past ~4 weeks.
      const topArtistsData = (await spotifyFetch(
        accessToken,
        "/me/top/artists?time_range=short_term&limit=14",
      )) as { items: SpotifyArtist[] };

      const topArtists = topArtistsData.items;

      // Fetch the top track and audio features for every artist in parallel.
      // Audio features are optional — Spotify deprecated this endpoint for apps
      // created after Nov 2024, so errors are swallowed.
      const artists: SpotifyArtistWithTrack[] = await Promise.all(
        topArtists.map(async (artist) => {
          try {
            const data = (await spotifyFetch(
              accessToken,
              `/artists/${artist.id}/top-tracks?market=GB`,
            )) as {
              tracks: SpotifyTrack[];
            };
            const top_track = data.tracks[0] ?? null;
            if (top_track?.id) {
              try {
                const features = await spotifyFetch(accessToken, `/audio-features/${top_track.id}`);
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

      // Pick one unique genre per artist, favouring the longest (most ridiculous) names.
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

      const randomGenres = sampleSize(artistGenres, Math.min(6, artistGenres.length));

      console.log(`Spotify: ${artists.length} artists, ${randomGenres.length} genres`);

      return [{ artists, id: "data", randomGenres }];
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
  external_urls: { spotify: string };
  followers: { total: number };
  genres: string[];
  id: string;
  images: { height: number; url: string; width: number }[];
  name: string;
  popularity: number;
}

interface SpotifyArtistWithTrack extends SpotifyArtist {
  top_track: null | SpotifyTrack;
}

interface SpotifyTrack {
  album: {
    images: { height: number; url: string; width: number }[];
    name: string;
  };
  external_urls: { spotify: string };
  id: string;
  name: string;
  preview_url: null | string;
}
