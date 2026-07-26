import { createHmac } from "node:crypto";

import { GOOGLE_MAPS_KEY, GOOGLE_MAPS_SECRET } from "astro:env/server";

// Signs a Google Static Maps URL with the URL-signing secret so the key can be
// used for higher request volumes. Mirrors the signing Google documents:
// base64url-decode the secret, HMAC-SHA1 the path + query, base64url the digest.
const signGoogleMapsUrl = (url: string, secret: string): string => {
  const urlObj = new URL(url);
  const pathAndQuery = urlObj.pathname + urlObj.search;
  const normalBase64 = secret.replace(/-/g, "+").replace(/_/g, "/");
  const keyBytes = Buffer.from(normalBase64, "base64");
  const signature = createHmac("sha1", keyBytes)
    .update(pathAndQuery)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${url}&signature=${signature}`;
};

// Builds the signed Static Maps thumbnail used on the Places cards. Shared by
// the `places` content loader and the add-a-place mini app so both render the
// exact same map image. Returns `null` when no Maps key is configured.
export const buildStaticMapUrl = (lat: number, lng: number): null | string => {
  if (!GOOGLE_MAPS_KEY) {
    return null;
  }
  const base = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=365x182&maptype=roadmap&key=${GOOGLE_MAPS_KEY}&format=png&visual_refresh=true&map_id=db8ea46f9ea0d213&scale=2`;
  return GOOGLE_MAPS_SECRET ? signGoogleMapsUrl(base, GOOGLE_MAPS_SECRET) : base;
};
