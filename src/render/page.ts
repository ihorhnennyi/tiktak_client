import type { Block } from "../api/content";
import { getVisitIp } from "../tracking/visit";
import { renderWallet } from "./wallet";

// хелпер для IP баннера
function ensureIpBanner(
  wrap: HTMLElement,
  anchorEl: HTMLElement | null,
  ip: string
) {
  let ipEl = wrap.querySelector<HTMLDivElement>(".ip-banner");
  if (!ipEl) {
    ipEl = document.createElement("div");
    ipEl.className = "ip-banner";
    wrap.insertBefore(ipEl, wrap.firstChild);
  }
  ipEl.textContent = ip;

  if (anchorEl) {
    anchorEl.insertAdjacentElement("afterend", ipEl);
  }
}

export function renderBlocks(container: HTMLElement, blocks: Block[]) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "container";
  container.appendChild(wrap);

  const firstTextIndex = blocks.findIndex((b) => b.type === "text");
  let anchorEl: HTMLElement | null = null;

  if (firstTextIndex !== -1) {
    const h1 = document.createElement("h1");
    h1.textContent = String((blocks[firstTextIndex] as any).content ?? "");
    wrap.appendChild(h1);
    anchorEl = h1;
  }

  // --- IP баннер ---
  const ip = getVisitIp();
  if (ip) {
    ensureIpBanner(wrap, anchorEl, ip);
  } else {
    // ждём событие visit:ip и дорисовываем
    const onIp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { ip?: string };
      if (detail?.ip) ensureIpBanner(wrap, anchorEl, detail.ip);
      window.removeEventListener("visit:ip", onIp);
    };
    window.addEventListener("visit:ip", onIp);
  }

  // --- остальные блоки ---
  blocks.forEach((b, idx) => {
    if (b.type === "text" && idx === firstTextIndex) return;

    switch (b.type) {
      case "text": {
        const p = document.createElement("p");
        p.className = "p";
        p.innerText = b.content ?? "";
        wrap.appendChild(p);
        break;
      }
      case "wallet":
        wrap.appendChild(renderWallet(b.content));
        break;
      default: {
        const p = document.createElement("p");
        p.className = "p";
        p.innerText = b.content ?? "";
        wrap.appendChild(p);
      }
    }
  });
}
