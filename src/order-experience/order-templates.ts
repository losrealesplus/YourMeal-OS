/**
 * OE004 — Experience-layer Order Templates.
 *
 * Operational patterns — not rigid recurring automation.
 * Starting points the operator adapts before confirm.
 * Session continuity until Product opens durable substrate.
 */

import type { CommitmentItem } from "./operational-commitments";

export type OrderTemplateSource =
  | "last_order"
  | "frequent"
  | "from_order"
  | "manual"
  | "preference";

export type OrderTemplate = {
  id: string;
  name: string;
  customerId: string;
  customerKind: "individual" | "company_account";
  customerName: string;
  /** Preferred weekday ISO hint — operator can change on apply. */
  preferredDeliveryDay?: string | null;
  items: CommitmentItem[];
  instructions: string;
  dietaryNotes?: string;
  addressNote?: string;
  source: OrderTemplateSource;
  createdAt: string;
  lastUsedAt?: string | null;
  useCount: number;
};

const STORAGE_KEY = "ymos.oe.order_templates.v1";

let memory: OrderTemplate[] = [];

function readAll(): OrderTemplate[] {
  if (typeof sessionStorage === "undefined") {
    return [...memory];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...memory];
    const parsed = JSON.parse(raw) as OrderTemplate[];
    return Array.isArray(parsed) ? parsed : [...memory];
  } catch {
    return [...memory];
  }
}

function writeAll(rows: OrderTemplate[]) {
  memory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function listOrderTemplates(customerId?: string): OrderTemplate[] {
  const all = readAll();
  const filtered = customerId
    ? all.filter((t) => t.customerId === customerId)
    : all;
  return [...filtered].sort((a, b) => {
    const aUse = a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0;
    const bUse = b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0;
    if (bUse !== aUse) return bUse - aUse;
    return b.useCount - a.useCount;
  });
}

export function saveOrderTemplate(
  input: Omit<OrderTemplate, "id" | "createdAt" | "useCount" | "lastUsedAt"> & {
    id?: string;
  },
): OrderTemplate {
  const rows = readAll();
  if (input.id) {
    const idx = rows.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const updated: OrderTemplate = {
        ...rows[idx]!,
        ...input,
        id: input.id,
        useCount: rows[idx]!.useCount,
        lastUsedAt: rows[idx]!.lastUsedAt,
      };
      const next = [...rows];
      next[idx] = updated;
      writeAll(next);
      return updated;
    }
  }
  const row: OrderTemplate = {
    ...input,
    id:
      input.id ??
      `ot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    useCount: 0,
    lastUsedAt: null,
  };
  writeAll([row, ...rows].slice(0, 60));
  return row;
}

export function markTemplateUsed(id: string): OrderTemplate | null {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const updated: OrderTemplate = {
    ...rows[idx]!,
    useCount: rows[idx]!.useCount + 1,
    lastUsedAt: new Date().toISOString(),
  };
  const next = [...rows];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function deleteOrderTemplate(id: string): boolean {
  const rows = readAll();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  writeAll(next);
  return true;
}

export function templateSummary(t: OrderTemplate): string {
  const items = t.items.map((i) => `${i.qty}× ${i.label}`).join(" · ");
  return [items, t.instructions].filter(Boolean).join(" · ") || "Vacía";
}

export function clearOrderTemplatesForTests() {
  memory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
