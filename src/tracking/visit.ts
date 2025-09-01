// src/tracking/visit.ts
import { API_BASE } from "../config";
import { collectClientData } from "../lib/collect";
import { logMessage } from "../lib/dom";

type VisitReason = "boot-timeout" | "socket-connect";

let visitSent = false;
let lastVisitIp: string | null = null;

/** Синхронно получить последний IP (если уже известен) */
export function getVisitIp(): string | null {
  return lastVisitIp;
}

/** Внутренняя помощь: диспатчим событие, когда узнали IP */
function dispatchIp(ip: string) {
  try {
    window.dispatchEvent(new CustomEvent("visit:ip", { detail: { ip } }));
  } catch {
    // без паники — событие просто не улетело
  }
}

/** Отправка визита с 1 ретраем при сетевой ошибке */
export async function trackVisit(
  reason: VisitReason,
  socketId?: string | null
): Promise<void> {
  if (visitSent) return;
  visitSent = true;

  const payload = collectClientData(socketId);

  // Обёртка с таймаутом (на случай зависших соединений)
  const postWithTimeout = async (url: string, ms = 6000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "include",
        signal: ctrl.signal,
      });
      return res;
    } finally {
      clearTimeout(t);
    }
  };

  const url = `${API_BASE}/api/visits`;

  // 1-й заход
  let res: Response | null = null;
  try {
    res = await postWithTimeout(url);
  } catch (e) {
    // 2-й заход (единственный ретрай) — только при сетевой ошибке/таймауте
    try {
      res = await postWithTimeout(url, 8000);
    } catch {
      logMessage("[visit] send error (network/timeout)");
      return;
    }
  }

  if (!res) {
    logMessage("[visit] no response object");
    return;
  }

  // Пытаемся вытащить IP из JSON; не ломаемся, если формат нестандартный
  try {
    const json = await res.json().catch(() => null);
    const ip = json?.data?.ip ?? json?.ip ?? null;

    if (ip) {
      lastVisitIp = String(ip);
      dispatchIp(lastVisitIp);
    }
  } catch {
    /* ignore parse */
  }

  logMessage(`[visit] sent (${reason}) status=${res.status}`);
}

/**
 * Если по каким-то причинам сокет не успел соединиться, отправляем визит через таймер.
 * По умолчанию — через 1200 мс. Повторно не отправит из-за флага visitSent.
 */
export function scheduleVisitFallback(delayMs = 1200) {
  setTimeout(() => {
    if (!visitSent) {
      // не ждём сокет — уходим в fallback
      void trackVisit("boot-timeout", null);
    }
  }, Math.max(0, delayMs));
}
