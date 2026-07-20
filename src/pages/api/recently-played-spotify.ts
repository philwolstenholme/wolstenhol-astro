import type { APIRoute } from "astro";

import { getSpotifyAccessToken, spotifyFetch } from "../../helpers/spotifyAuth";

export const prerender = false;

// Once a listen is this old, treat it as no longer "live".
const STALE_AFTER_MINUTES = 30;

type SpotifyLivePayload =
  | Record<string, never>
  | {
      artistList: string;
      name: string;
      playedAt: string;
      trackUrl: string;
    };

type SpotifyLiveTrack = {
  artists: { name: string }[];
  external_urls: { spotify: string };
  name: string;
};

const json = (data: SpotifyLivePayload) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status: 200,
  });

const toPayload = (track: SpotifyLiveTrack, playedAt: string): SpotifyLivePayload => ({
  artistList: track.artists.map((artist) => artist.name).join(", "),
  name: track.name,
  playedAt,
  trackUrl: track.external_urls.spotify,
});

export const GET: APIRoute = async () => {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    return json({});
  }

  try {
    const current = (await spotifyFetch(accessToken, "/me/player/currently-playing")) as null | {
      is_playing: boolean;
      item: null | SpotifyLiveTrack;
      progress_ms: null | number;
    };

    if (current?.is_playing && current.item) {
      // Anchor to when the track started, not "now" — otherwise every 30s
      // poll would reset the relative-time label back to "just now".
      const startedAt = new Date(Date.now() - (current.progress_ms ?? 0)).toISOString();
      return json(toPayload(current.item, startedAt));
    }

    const recent = (await spotifyFetch(accessToken, "/me/player/recently-played?limit=1")) as {
      items: { played_at: string; track: SpotifyLiveTrack }[];
    };

    const last = recent.items[0];
    if (!last) {
      return json({});
    }

    const minutesAgo = (Date.now() - new Date(last.played_at).getTime()) / 60_000;
    if (minutesAgo > STALE_AFTER_MINUTES) {
      return json({});
    }

    return json(toPayload(last.track, last.played_at));
  } catch (error) {
    console.error("recently-played-spotify:", error);
    return json({});
  }
};
