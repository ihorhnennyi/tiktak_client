import type { Block } from "../api/content";
import { getVisitIp } from "../tracking/visit"; // <— берём IP
import { renderWallet } from "./wallet";

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
    anchorEl = h1; // <— после него вставим IP
  }

  // --- IP баннер (если знаем IP) ---
  const ip = getVisitIp();
  if (ip) {
    const ipEl = document.createElement("div");
    ipEl.className = "ip-banner";
    ipEl.textContent = ip;

    if (anchorEl) {
      // есть заголовок — вставляем сразу после него
      anchorEl.insertAdjacentElement("afterend", ipEl);
    } else {
      // заголовка нет — показываем IP первым элементом
      wrap.appendChild(ipEl);
    }
  }

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
