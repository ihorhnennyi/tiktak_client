// src/render/wallet.ts
export function renderWallet(raw: string) {
  const wrap = document.createElement("div");
  wrap.className = "wallet";

  const value = document.createElement("span");
  value.className = "wallet__value";
  value.innerText = raw ?? "";

  const copy = document.createElement("button");
  copy.className = "wallet__copy";
  copy.type = "button";
  copy.title = "Скопировать";
  copy.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 8h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6"/>
      <path d="M6 16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.6"/>
    </svg>
  `;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(raw || "");
      copy.blur();
      copy.textContent = "✓";
      setTimeout(() => {
        copy.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 8h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6 16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        `;
      }, 900);
    } catch {
      alert("Не удалось скопировать");
    }
  };

  wrap.appendChild(value);
  wrap.appendChild(copy);
  return wrap;
}
