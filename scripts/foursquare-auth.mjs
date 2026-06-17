/**
 * One-shot Foursquare OAuth helper.
 * Usage: node scripts/foursquare-auth.mjs <CLIENT_ID> <CLIENT_SECRET>
 *
 * 1. Starts a local server on port 3838
 * 2. Opens the Foursquare OAuth consent screen in your browser
 * 3. Exchanges the returned code for an access token
 * 4. Prints the token so you can add it to .env as FOURSQUARE_OAUTH_TOKEN
 */

import { execFile } from "child_process";
import http from "http";
import { URL } from "url";

const [, , CLIENT_ID, CLIENT_SECRET] = process.argv;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: node scripts/foursquare-auth.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const PORT = 3838;
const REDIRECT_URI = `http://localhost:${PORT}`;

const authUrl =
  `https://foursquare.com/oauth2/authenticate` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("No code received. Try again.");
    return;
  }

  res.end("<html><body><h1>Got it! You can close this tab.</h1></body></html>");

  const tokenUrl =
    `https://foursquare.com/oauth2/access_token` +
    `?client_id=${CLIENT_ID}` +
    `&client_secret=${CLIENT_SECRET}` +
    `&grant_type=authorization_code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code=${code}`;

  const response = await fetch(tokenUrl);
  const data = await response.json();

  server.close();

  if (data.access_token) {
    console.log("\n✅ Success! Add this to your .env:\n");
    console.log(`FOURSQUARE_OAUTH_TOKEN="${data.access_token}"\n`);
  } else {
    console.error("\n❌ Token exchange failed:", JSON.stringify(data, null, 2));
  }
});

server.listen(PORT, () => {
  console.log(`\nOpening Foursquare OAuth in your browser…`);
  console.log(`(redirect URI: ${REDIRECT_URI})\n`);
  execFile("open", [authUrl]);
});
