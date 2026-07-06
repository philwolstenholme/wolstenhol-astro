import { UAParser } from "ua-parser-js";

export function detectMobile(request: Request): boolean {
  const clientHint = request.headers.get("Sec-CH-UA-Mobile");
  console.log("Client Hint:", clientHint);
  if (clientHint !== null) {
    return clientHint === "?1";
  }

  const ua = request.headers.get("User-Agent");
  if (ua) {
    const { device } = UAParser(ua);
    const mobileDeviceTypes: (typeof device.type)[] = ["mobile", "wearable"];
    return mobileDeviceTypes.includes(device.type);
  }

  return false;
}
