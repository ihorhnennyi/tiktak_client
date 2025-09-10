// src/main.ts
import { fetchBlocks } from "./api/content";
import { $, enableDebugFromQuery, logMessage, setDarkTheme } from "./lib/dom";
import { renderBlocks } from "./render/page";
import setupSocket from "./socket/setup";
import "./style.css";
import { scheduleVisitFallback } from "./tracking/visit";

/* ================== DOM refs & params ================== */
const app = $("#app") as HTMLElement | null;
const urlq = new URLSearchParams(location.search);
const defaultLocale = (location.pathname.split("/")[1] || "ua").toLowerCase();
const autoStart = urlq.has("autostart");

/* ================== boot helpers ================== */
function ensureAppClass(node: HTMLElement | null) {
  if (node && !node.classList.contains("app")) node.classList.add("app");
}

/* ================== Fullscreen (desktop + iOS/Android) ================== */
function canFullscreen(): boolean {
  const el: any = document.documentElement;
  return !!(
    el?.requestFullscreen ||
    el?.webkitRequestFullscreen ||
    el?.mozRequestFullScreen ||
    el?.msRequestFullscreen
  );
}

function requestFsOn(el: any): Promise<void> {
  const req =
    el?.requestFullscreen ||
    el?.webkitRequestFullscreen ||
    el?.mozRequestFullScreen ||
    el?.msRequestFullscreen;

  return req
    ? Promise.resolve(req.call(el, { navigationUI: "hide" }))
    : Promise.reject();
}

async function requestFullscreenOnce() {
  const alreadyFs =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement;

  if (alreadyFs || !canFullscreen()) return;

  try {
    await requestFsOn(document.documentElement); // пробуем <html>
  } catch {
    try {
      await requestFsOn(document.body); // пробуем <body> (часть мобильных)
    } catch {
      /* тихий фолбэк */
    }
  }
}

/* навешиваем один раз: жесты, которые точно происходят по user gesture */
["pointerdown", "touchend", "click"].forEach((ev) =>
  document.addEventListener(ev, requestFullscreenOnce, {
    once: true,
    passive: true,
  })
);

/* ================== main bootstrap ================== */
async function bootstrap() {
  enableDebugFromQuery();
  scheduleVisitFallback();
  ensureAppClass(app);

  if (!app) {
    console.warn("[client] #app not found");
    return;
  }

  // socket + visit tracking
  setupSocket(app, defaultLocale);

  // автозапуск контента в dev/по запросу
  if (autoStart) {
    try {
      setDarkTheme(true);
      const blocks = (await fetchBlocks(defaultLocale)) || [];
      renderBlocks(app, blocks);
      logMessage("[DEV] autostart");
    } catch (e) {
      console.error("[client] autostart error:", e);
    }
  }
}

/* run */
void bootstrap();

// опционально: для ручного дебага в консоли
// @ts-ignore
(window as any).__fs = requestFullscreenOnce;
