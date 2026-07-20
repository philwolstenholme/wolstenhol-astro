/**
 * One-shot Spotify OAuth helper — generates a refresh token covering both the
 * top-artists feature (user-top-read) and the live listening status feature
 * (user-read-currently-playing, user-read-recently-played).
 *
 * Usage: node scripts/spotify-auth.mjs <CLIENT_ID> <CLIENT_SECRET>
 *
 * 1. Starts a local server on port 8888
 * 2. Opens the Spotify OAuth consent screen in your browser
 * 3. Exchanges the returned code for a refresh token
 * 4. Prints the token so you can add it to .env / Netlify as SPOTIFY_REFRESH_TOKEN
 *
 * Note: http://127.0.0.1:8888/callback must be added as a Redirect URI on your
 * app in the Spotify Developer Dashboard (Settings > Redirect URIs) first.
 * Spotify requires the loopback IP "127.0.0.1", not "localhost".
 */

import { execFile } from "child_process";
import http from "http";
import { URL } from "url";

const [, , CLIENT_ID, CLIENT_SECRET] = process.argv;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: node scripts/spotify-auth.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ["user-top-read", "user-read-currently-playing", "user-read-recently-played"].join(
  " ",
);

const authUrl =
  `https://accounts.spotify.com/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.end(`<html><body><h1>Spotify denied: ${error}</h1></body></html>`);
    return;
  }

  if (!code) {
    res.end("No code received. Try again.");
    return;
  }

  res.end("<html><body><h1>Got it! You can close this tab.</h1></body></html>");

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const data = await response.json();

  server.close();

  if (data.refresh_token) {
    console.log("\n✅ Success! Add this to your .env / Netlify env vars:\n");
    console.log(`SPOTIFY_REFRESH_TOKEN="${data.refresh_token}"\n`);
  } else {
    console.error("\n❌ Token exchange failed:", JSON.stringify(data, null, 2));
  }
});

server.listen(PORT, () => {
  console.log(`\nOpening Spotify OAuth in your browser…`);
  console.log(
    `(redirect URI: ${REDIRECT_URI} — must be registered in your Spotify app's settings)\n`,
  );
  execFile("open", [authUrl]);
});
