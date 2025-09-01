import { collectClientData } from "../lib/collect";
import { logMessage } from "../lib/dom";

let visitSent = false;
let lastVisitIp: string | null = null; // <— тут храним IP

export function getVisitIp() {
  return lastVisitIp;
}

export async function trackVisit(
  reason: "boot-timeout" | "socket-connect",
  socketId?: string | null
) {
  if (visitSent) return;
  visitSent = true;

  const payload = collectClientData(socketId);

  try {
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    // пробуем вытащить ip из ответа
    try {
      const json = await res.json();
      // контроллер возвращает ok({ message, ip }), т.е. { success: true, data: { ip, ... } }
      const ip =
        json?.data?.ip ??
        json?.ip ?? // на всякий случай
        null;
      if (ip) lastVisitIp = String(ip);
    } catch {
      /* ignore json parse */
    }

    logMessage(`[visit] sent (${reason})`);
  } catch {
    logMessage("[visit] send error");
  }
}

export function scheduleVisitFallback() {
  setTimeout(() => {
    if (!visitSent) trackVisit("boot-timeout", null);
  }, 1200);
}
