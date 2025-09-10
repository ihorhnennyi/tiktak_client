// src/main.ts
import { fetchBlocks } from "./api/content";
import { $, enableDebugFromQuery, logMessage, setDarkTheme } from "./lib/dom";
import { renderBlocks } from "./render/page";
import setupSocket from "./socket/setup";
import "./style.css";
import { scheduleVisitFallback } from "./tracking/visit";

const app = $("#app") as HTMLElement | null;
const urlq = new URLSearchParams(location.search);
const defaultLocale = (location.pathname.split("/")[1] || "ua").toLowerCase();
const autoStart = urlq.has("autostart");

enableDebugFromQuery();
scheduleVisitFallback();

if (app) {
  setupSocket(app, defaultLocale);

  (async () => {
    if (autoStart) {
      setDarkTheme(true);
      const blocks = (await fetchBlocks(defaultLocale)) || [];
      renderBlocks(app, blocks);
      logMessage("[DEV] autostart");
    }
  })();
}

// гарантируем, что корневой элемент имеет класс .app
if (app && !app.classList.contains("app")) {
  app.classList.add("app");
}

/* ==== Fullscreen по клику в любом месте ==== */
function requestFullscreenOnce() {
  const el: any = document.documentElement;
  const alreadyFs =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement;

  if (alreadyFs) return;

  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;

  try {
    req && req.call(el, { navigationUI: "hide" });
  } catch {
    /* ignore */
  }
}

// Один раз по первому тапу/клику
document.addEventListener("pointerdown", requestFullscreenOnce, { once: true });
// резерв на случай клавиатуры/клика мышью
document.addEventListener("click", requestFullscreenOnce, { once: true });
