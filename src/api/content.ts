// src/api/content.ts
import { API_BASE } from "../config";

export type Block =
  | { type: "text"; content: string }
  | { type: "wallet"; content: string }
  | { type: string; content: string };

type BlocksResponse =
  | { success: true; data: { locale: string; blocks: Block[] } }
  | Record<string, any>;

export async function fetchBlocks(locale: string): Promise<Block[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/content/${encodeURIComponent(locale)}`,
      {
        credentials: "include", // чтобы куки прокидывались (если надо)
      }
    );

    const payload: BlocksResponse = await res.json();

    if ((payload as any)?.success && (payload as any).data?.blocks)
      return (payload as any).data.blocks as Block[];

    if ((payload as any)?.blocks) return (payload as any).blocks as Block[];

    // legacy-режим
    const p = payload as any;
    const legacy: Block[] = [];
    if (p?.title) legacy.push({ type: "text", content: String(p.title) });
    if (p?.subtitle) legacy.push({ type: "text", content: String(p.subtitle) });
    if (p?.bodyHtml) legacy.push({ type: "text", content: String(p.bodyHtml) });
    return legacy.length ? legacy : null;
  } catch {
    return null;
  }
}
