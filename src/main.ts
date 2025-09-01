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
