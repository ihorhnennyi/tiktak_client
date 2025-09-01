export const $ = <T extends Element = Element>(s: string) =>
  document.querySelector(s) as T | null;

const logBox = $("#log") as HTMLDivElement | null;

export function logMessage(t: string) {
  if (!logBox || logBox.hidden) return;
  logBox.innerHTML += `<p><strong>LOG:</strong> ${escapeHtml(t)}</p>`;
  logBox.scrollTop = logBox.scrollHeight;
}

export function enableDebugFromQuery() {
  const dbg = new URLSearchParams(location.search).has("debug");
  if (dbg && logBox) logBox.hidden = false;
}

export function setDarkTheme(on = true) {
  document.body.classList.toggle("theme-dark", on);
}

export function escapeHtml(s: unknown) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
