/**
 * OE003 — Experience-layer order corrections.
 *
 * Order Facade has no UpdateOrder intent (Capability frozen).
 * Corrections live here so the operator can fix a live commitment
 * without leaving the conversation (PRODUCT LAW 001 · Manifesto).
 *
 * Session continuity only — not a second Order database.
 */

import type { CommitmentItem } from "./operational-commitments";

export type OrderEditPatch = {
  deliveryDay?: string;
  instructions?: string;
  dietaryNotes?: string;
  addressNote?: string;
  items?: CommitmentItem[];
  updatedAt: string;
};

const STORAGE_KEY = "ymos.oe.operational_order_edits.v1";

let memoryEdits: Record<string, OrderEditPatch> = {};

function readEdits(): Record<string, OrderEditPatch> {
  if (typeof sessionStorage === "undefined") {
    return { ...memoryEdits };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...memoryEdits };
    const parsed = JSON.parse(raw) as Record<string, OrderEditPatch>;
    return parsed && typeof parsed === "object" ? parsed : { ...memoryEdits };
  } catch {
    return { ...memoryEdits };
  }
}

function writeEdits(map: Record<string, OrderEditPatch>) {
  memoryEdits = map;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Facade-order overlay key (never invent durable writes). */
export function facadeEditKey(orderId: string) {
  return `facade:${orderId}`;
}

export function getOrderEdit(key: string): OrderEditPatch | null {
  return readEdits()[key] ?? null;
}

export function saveOrderEdit(
  key: string,
  patch: Omit<OrderEditPatch, "updatedAt">,
): OrderEditPatch {
  const next: OrderEditPatch = {
    ...getOrderEdit(key),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeEdits({ ...readEdits(), [key]: next });
  return next;
}

export function clearOrderEditsForTests() {
  memoryEdits = {};
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function applyEditToDisplay(input: {
  deliveryDay: string | null;
  instructions: string;
  dietaryNotes: string;
  addressNote: string;
  items: CommitmentItem[];
  edit: OrderEditPatch | null;
}): {
  deliveryDay: string | null;
  instructions: string;
  dietaryNotes: string;
  addressNote: string;
  items: CommitmentItem[];
} {
  if (!input.edit) {
    return {
      deliveryDay: input.deliveryDay,
      instructions: input.instructions,
      dietaryNotes: input.dietaryNotes,
      addressNote: input.addressNote,
      items: input.items,
    };
  }
  return {
    deliveryDay: input.edit.deliveryDay ?? input.deliveryDay,
    instructions: input.edit.instructions ?? input.instructions,
    dietaryNotes: input.edit.dietaryNotes ?? input.dietaryNotes,
    addressNote: input.edit.addressNote ?? input.addressNote,
    items: input.edit.items ?? input.items,
  };
}
