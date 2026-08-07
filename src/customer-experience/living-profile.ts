/**
 * CX005 — Living Customer Profile (Experience layer).
 *
 * Profile grows with the relationship. Session enrichment until
 * UpdateCustomer substrate is opened (Facade remains frozen).
 */

import type { PartyRef } from "@/customer/CustomerContext";

export type LivingProfileGrowth = {
  preferences?: string | null;
  foodRestrictions?: string | null;
  allergies?: string | null;
  operationalNotes?: string | null;
  billingInfo?: string | null;
  companyDetails?: string | null;
  tags?: string | null;
  updatedAt: string;
};

export type GrowthSectionId =
  | "preferences"
  | "foodRestrictions"
  | "allergies"
  | "operationalNotes"
  | "billingInfo"
  | "companyDetails"
  | "tags";

export const GROWTH_SECTIONS: {
  id: GrowthSectionId;
  title: string;
  hint: string;
  field: keyof Omit<LivingProfileGrowth, "updatedAt">;
}[] = [
  {
    id: "preferences",
    title: "Preferencias",
    hint: "Horario · canal · estilo de pedido",
    field: "preferences",
  },
  {
    id: "foodRestrictions",
    title: "Restricciones alimentarias",
    hint: "Sin gluten · vegetariano · …",
    field: "foodRestrictions",
  },
  {
    id: "allergies",
    title: "Alergias",
    hint: "Cuando la relación lo requiera",
    field: "allergies",
  },
  {
    id: "operationalNotes",
    title: "Notas operativas",
    hint: "Lo que el equipo necesita recordar",
    field: "operationalNotes",
  },
  {
    id: "billingInfo",
    title: "Facturación",
    hint: "Cuando empiece a facturar — no antes",
    field: "billingInfo",
  },
  {
    id: "companyDetails",
    title: "Detalle de organización",
    hint: "CIF · convenio · Progressive",
    field: "companyDetails",
  },
  {
    id: "tags",
    title: "Etiquetas",
    hint: "VIP · ruta Adeje · …",
    field: "tags",
  },
];

const STORAGE_KEY = "ymos.cx.living_profile.v1";

type Ledger = Record<string, LivingProfileGrowth>;

let memoryLedger: Ledger = {};

function partyKey(ref: PartyRef) {
  return `${ref.kind}:${ref.id}`;
}

function readLedger(): Ledger {
  if (typeof sessionStorage === "undefined") return { ...memoryLedger };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...memoryLedger };
    return { ...memoryLedger, ...(JSON.parse(raw) as Ledger) };
  } catch {
    return { ...memoryLedger };
  }
}

function writeLedger(ledger: Ledger) {
  memoryLedger = { ...ledger };
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    /* ignore */
  }
}

export function getLivingProfile(ref: PartyRef): LivingProfileGrowth | null {
  return readLedger()[partyKey(ref)] ?? null;
}

export function saveLivingProfileSection(
  ref: PartyRef,
  field: keyof Omit<LivingProfileGrowth, "updatedAt">,
  value: string | null,
): LivingProfileGrowth {
  const ledger = readLedger();
  const key = partyKey(ref);
  const prev = ledger[key] ?? { updatedAt: new Date().toISOString() };
  const next: LivingProfileGrowth = {
    ...prev,
    [field]: value,
    updatedAt: new Date().toISOString(),
  };
  ledger[key] = next;
  writeLedger(ledger);
  return next;
}

export function livingProfileCompleteness(
  growth: LivingProfileGrowth | null,
): { filled: number; total: number; percent: number } {
  const total = GROWTH_SECTIONS.length + 1; // + attachments (future, always empty for now)
  let filled = 0;
  for (const section of GROWTH_SECTIONS) {
    const v = growth?.[section.field];
    if (typeof v === "string" && v.trim()) filled += 1;
  }
  // Attachments future — never counts as missing punishment
  const percent = Math.round((filled / GROWTH_SECTIONS.length) * 100);
  return { filled, total: GROWTH_SECTIONS.length, percent };
}
