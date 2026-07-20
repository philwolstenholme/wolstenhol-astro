import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } from "astro:env/server";

export const getSpotifyAccessToken = async (): Promise<null | string> => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return null;
  }

  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!tokenRes.ok) {
    console.error("Spotify token refresh failed:", await tokenRes.text());
    return null;
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  return access_token;
};

// Spotify returns 204 with an empty body for endpoints like
// /me/player/currently-playing when there's nothing to report.
export const spotifyFetch = async (accessToken: string, path: string): Promise<unknown> => {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Spotify API ${path} → ${res.status}`);
  }

  return res.json();
};
