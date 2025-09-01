import { getSessionId } from "./session";

export function collectClientData(socketId?: string | null) {
  const nav = navigator as any;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;

  return {
    siteId: location.hostname,
    origin: location.origin,
    path: location.pathname + location.search + location.hash,
    sessionId: getSessionId(),
    mac: undefined,
    userAgent: navigator.userAgent,
    lang: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}`,
    platform: navigator.platform || "",
    referrer: document.referrer || "",
    socketId: socketId || null,

    memory: (nav?.deviceMemory ?? 0) as number,
    cores: (nav?.hardwareConcurrency ?? 0) as number,
    maxTouchPoints: (nav?.maxTouchPoints ?? 0) as number,
    online: navigator.onLine,
    secure: location.protocol === "https:",
    cookieEnabled: navigator.cookieEnabled,
    connectionType: conn?.effectiveType || "",

    country: undefined,
    region: undefined,
    city: undefined,
  };
}
