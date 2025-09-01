// src/lib/session.ts
const KEY = "__client_session_id";

export function getSessionId(): string {
  let id: string = localStorage.getItem(KEY) ?? "";
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ||
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(KEY, id); // теперь точно string
  }
  return id; // тоже точно string
}
