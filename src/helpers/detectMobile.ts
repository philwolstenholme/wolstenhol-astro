import { UAParser } from "ua-parser-js";

export function detectMobile(request: Request): boolean {
  const clientHint = request.headers.get("Sec-CH-UA-Mobile");
  console.log("Client Hint:", clientHint);
  if (clientHint !== null) {
    return clientHint === "?1";
  }

  const ua = request.headers.get("User-Agent");
  if (ua) {
    console.log("User-Agent:", ua);
    const { device } = UAParser(ua);
    console.log("Device Type:", device.type);
    const mobileDeviceTypes: (typeof device.type)[] = ["mobile", "wearable"];
    console.log("Is Mobile Device:", mobileDeviceTypes.includes(device.type));
    return mobileDeviceTypes.includes(device.type);
  }

  return false;
}
