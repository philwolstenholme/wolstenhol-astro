import { UAParser } from "ua-parser-js";

export function detectMobile(request: Request): boolean {
  const clientHint = request.headers.get("Sec-CH-UA-Mobile");
  if (clientHint !== null) {
    return clientHint === "?1";
  }

  const ua = request.headers.get("User-Agent");
  if (ua) {
    const { device } = UAParser(ua);
    return (["mobile", "wearable"] as (typeof device.type)[]).includes(
      device.type,
    );
  }

  return false;
}
