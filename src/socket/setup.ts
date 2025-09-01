// src/socket/setup.ts
import { io, Socket } from "socket.io-client";
import { fetchBlocks } from "../api/content";
import { WS_BASE } from "../config"; // <-- добавить
import { logMessage, setDarkTheme } from "../lib/dom";
import { renderBlocks } from "../render/page";
import { trackVisit } from "../tracking/visit";

type AdminMessage =
  | { type: "text"; text: string }
  | { type: "set-color"; text: string }
  | { type: "show-content"; locale?: string }
  | { type: "block-mode"; text: string }; // "on" | "off"

export default function setupSocket(appEl: HTMLElement, defaultLocale: string) {
  const socket: Socket = io(WS_BASE, {
    path: "/socket.io", // явный путь сокетов
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    withCredentials: true, // если сервер ставит/читает cookie
    // важно: чтобы бэк положил клиента в нужные комнаты вида site:<host>
    auth: { siteId: location.host },
  });

  socket.on("connect", () => {
    logMessage(`WS connected: ${socket.id}`);
    trackVisit("socket-connect", socket.id);
    console.info("[client] socketId:", socket.id);
  });

  socket.onAny((event, ...args) => {
    logMessage(`[onAny] ${event}: ${JSON.stringify(args?.[0])?.slice(0, 300)}`);
  });

  socket.on("admin-message", handleAdminMessage);
  socket.on("message", handleAdminMessage);
  socket.on("visit-message", handleAdminMessage);
  socket.on("visit:message", handleAdminMessage);

  socket.on("disconnect", (reason) => {
    logMessage(`WS disconnected: ${String(reason)}`);
  });

  socket.on("reconnect", () => logMessage("WS reconnected"));

  async function handleAdminMessage(raw: unknown) {
    const msg: AdminMessage | null =
      typeof raw === "string" ? safeParse(raw) : (raw as any);

    if (!msg || typeof msg !== "object" || !("type" in msg)) {
      logMessage("⚠️ неизвестный формат socket-сообщения");
      return;
    }

    switch (msg.type) {
      case "text":
        alert(msg.text);
        logMessage(msg.text);
        break;

      case "set-color":
        document.body.style.backgroundColor = msg.text;
        logMessage(`Цвет фона: ${msg.text}`);
        break;

      case "block-mode": {
        const on = String(msg.text).toLowerCase() === "on";
        if (on) {
          await renderDarkWithLocale(appEl, defaultLocale);
          logMessage("block-mode: ON (контент отрисован)");
        } else {
          setDarkTheme(false);
          logMessage("block-mode: OFF");
        }
        break;
      }

      case "show-content": {
        const loc = (msg.locale || defaultLocale).toLowerCase();
        await renderDarkWithLocale(appEl, loc);
        logMessage("Показ контента по socket-сообщению. Локаль: " + loc);
        break;
      }

      default:
        logMessage("⚠️ неизвестный type: " + (msg as any).type);
    }
  }

  return socket;
}

/* ================ helpers =============== */

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function renderDarkWithLocale(appEl: HTMLElement, locale: string) {
  setDarkTheme(true);
  const loc = (locale || "").toLowerCase();
  const blocks = (await fetchBlocks(loc)) || [];
  renderBlocks(appEl, blocks);
}
