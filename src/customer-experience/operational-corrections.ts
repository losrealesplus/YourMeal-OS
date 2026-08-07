/**
 * CX003 — Experience-layer operational corrections.
 *
 * UpdateCustomer is declared on the Facade but substrate returns UNIMPLEMENTED.
 * Until Product opens Facade persistence, corrections live here so the operator
 * can keep working (PRODUCT LAW 001 · EXPERIENCE MANIFESTO 001).
 *
 * Not a second database. Session continuity only.
 */

import type {
  CustomerContext,
  PartyRef,
} from "@/customer/CustomerContext";

export type OperationalCorrection = {
  displayName?: string;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  notes?: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "ymos.cx.operational_corrections.v1";

type Ledger = Record<string, OperationalCorrection>;

/** In-memory fallback when sessionStorage is unavailable (tests / SSR). */
let memoryLedger: Ledger = {};

function partyKey(ref: PartyRef) {
  return `${ref.kind}:${ref.id}`;
}

function readLedger(): Ledger {
  if (typeof sessionStorage === "undefined") {
    return { ...memoryLedger };
  }
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

export function saveOperationalCorrection(
  ref: PartyRef,
  patch: Omit<OperationalCorrection, "updatedAt">,
): OperationalCorrection {
  const ledger = readLedger();
  const key = partyKey(ref);
  const prev = ledger[key];
  const next: OperationalCorrection = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  ledger[key] = next;
  writeLedger(ledger);
  return next;
}

export function getOperationalCorrection(
  ref: PartyRef,
): OperationalCorrection | null {
  return readLedger()[partyKey(ref)] ?? null;
}

/** Merge session corrections over Facade context for display / continue-working. */
export function applyOperationalCorrection(
  context: CustomerContext,
): CustomerContext {
  const correction = getOperationalCorrection({
    kind: context.summary.partyKind,
    id: context.summary.id,
  });
  if (!correction) return context;

  const displayName =
    correction.displayName?.trim() || context.summary.displayName;
  const email =
    correction.email !== undefined
      ? correction.email
      : context.profile?.email ?? null;
  const phone =
    correction.phone !== undefined
      ? correction.phone
      : context.profile?.phones?.[0]?.e164 ?? null;

  const addresses = [...(context.profile?.addresses ?? [])];
  if (
    correction.addressLine !== undefined ||
    correction.city !== undefined
  ) {
    const line1 =
      correction.addressLine !== undefined
        ? correction.addressLine ?? ""
        : addresses[0]?.line1 ?? "";
    const city =
      correction.city !== undefined
        ? correction.city ?? undefined
        : addresses[0]?.city;
    if (addresses[0]) {
      addresses[0] = {
        ...addresses[0],
        line1,
        city,
        isDefaultDelivery: true,
      };
    } else if (line1 || city) {
      addresses.push({
        id: `${context.summary.id}:cx-correction`,
        line1,
        city,
        isDefaultDelivery: true,
      });
    }
  }

  const profile = context.profile
    ? {
        ...context.profile,
        fullName: displayName,
        email,
        phones: phone
          ? [
              {
                id: context.profile.phones[0]?.id ?? `${context.summary.id}:phone`,
                e164: phone,
              },
            ]
          : [],
        addresses,
        preferences: {
          ...context.profile.preferences,
          ...(correction.notes
            ? { operationalNotes: correction.notes }
            : {}),
        },
      }
    : context.profile;

  return {
    ...context,
    summary: {
      ...context.summary,
      displayName,
    },
    profile,
  };
}
