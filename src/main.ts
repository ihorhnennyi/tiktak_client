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

function isFullscreenNow(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
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
    : Promise.reject(new Error("Fullscreen API not available"));
}

async function requestFullscreenOnce() {
  if (isFullscreenNow() || !canFullscreen()) return;
  try {
    // Пробуем <html>
    await requestFsOn(document.documentElement);
  } catch {
    try {
      // Пробуем <body> (часть мобильных)
      await requestFsOn(document.body);
    } catch {
      // Тихий фолбэк — ничего не делаем
    }
  }
}

/** Детект, что это уже установленная PWA (и так без адресной строки) */
function isStandalonePWA(): boolean {
  // Android/desktop
  const standaloneDisplay =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true;
  // iOS Safari
  const iosStandalone = (navigator as any)?.standalone === true;
  return standaloneDisplay || iosStandalone;
}

/**
 * Пытаемся автоматически войти в fullscreen через delayMs.
 * Если не вышло (браузер требует user-gesture), то первое ЛЮБОЕ касание
 * на странице мгновенно включает fullscreen — без кнопок/оверлеев.
 */
function scheduleAutoFullscreen(delayMs = 2000) {
  // В PWA-standalone и так "на весь экран", лишний fullscreen не нужен
  if (isStandalonePWA()) return;

  // Попытка авто-входа (может быть заблокирована политикой браузера)
  setTimeout(async () => {
    try {
      await requestFullscreenOnce();
    } catch {
      /* ignore */
    }

    // Если не получилось — включаем "мягкий" фолбэк на первый жест
    if (!isFullscreenNow()) {
      const onFirstGesture = async () => {
        document.removeEventListener("pointerdown", onFirstGesture, true);
        document.removeEventListener("touchend", onFirstGesture, true);
        document.removeEventListener("click", onFirstGesture, true);
        await requestFullscreenOnce();
      };
      // Ставим перехватчики "рано", чтобы жест точно считался
      document.addEventListener("pointerdown", onFirstGesture, {
        once: true,
        passive: true,
        capture: true,
      });
      document.addEventListener("touchend", onFirstGesture, {
        once: true,
        passive: true,
        capture: true,
      });
      document.addEventListener("click", onFirstGesture, {
        once: true,
        passive: true,
        capture: true,
      });
    }
  }, Math.max(0, delayMs));
}

/* ============ Подстраховка: единоразовый слушатель на всякий случай ============ */
/* Если вдруг пользователь успеет кликнуть раньше таймера — тоже уйдём в fullscreen */
["pointerdown", "touchend", "click"].forEach((ev) =>
  document.addEventListener(ev, () => requestFullscreenOnce(), {
    once: true,
    passive: true,
  })
);

/* ================== main bootstrap ================== */
async function bootstrap() {
  enableDebugFromQuery();
  scheduleVisitFallback();
  ensureAppClass(app);

  // ——— АВТО-ПОЛНЫЙ ЭКРАН ———
  // Пытаемся через ~2с; если заблокировано — первый жест включит FS без кнопок
  scheduleAutoFullscreen(2000);

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
