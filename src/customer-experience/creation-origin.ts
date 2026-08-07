/**
 * Customer Experience — creation origin (Era 2 evidence).
 *
 * Not asked to the operator. Registered automatically by the Experience.
 * PRODUCT LAW 001: later answers “what % of customers are no longer manual?”
 *
 * Phase 1: Experience-layer evidence only (no Facade / Capability change).
 * Persistence onto the customer record is a future progressive step.
 */

export const CUSTOMER_CREATION_ORIGINS = [
  "customer_workspace",
  "quick_capture",
  "import_pipeline",
  "api",
  "excel_import",
] as const;

export type CustomerCreationOrigin = (typeof CUSTOMER_CREATION_ORIGINS)[number];

/** Human labels — never shown as a form; used for evidence / UI hint. */
export const CUSTOMER_CREATION_ORIGIN_LABEL: Record<
  CustomerCreationOrigin,
  string
> = {
  customer_workspace: "Customer Workspace",
  quick_capture: "Quick Capture",
  import_pipeline: "Import Pipeline",
  api: "API",
  excel_import: "Excel Import",
};

export type CustomerCreationOriginEvent = {
  origin: CustomerCreationOrigin;
  partyKind: string;
  partyId: string;
  at: string;
};

const STORAGE_KEY = "ymos.cx.creation_origin.v1";

type OriginLedger = {
  counts: Partial<Record<CustomerCreationOrigin, number>>;
  events: CustomerCreationOriginEvent[];
};

function readLedger(): OriginLedger {
  if (typeof sessionStorage === "undefined") {
    return { counts: {}, events: [] };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { counts: {}, events: [] };
    const parsed = JSON.parse(raw) as OriginLedger;
    return {
      counts: parsed.counts ?? {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { counts: {}, events: [] };
  }
}

function writeLedger(ledger: OriginLedger) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Record where an alta happened. Silent. No user prompt.
 */
export function recordCustomerCreationOrigin(input: {
  origin: CustomerCreationOrigin;
  partyKind: string;
  partyId: string;
}): CustomerCreationOriginEvent {
  const event: CustomerCreationOriginEvent = {
    origin: input.origin,
    partyKind: input.partyKind,
    partyId: input.partyId,
    at: new Date().toISOString(),
  };
  const ledger = readLedger();
  ledger.counts[input.origin] = (ledger.counts[input.origin] ?? 0) + 1;
  ledger.events = [event, ...ledger.events].slice(0, 50);
  writeLedger(ledger);

  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[CX] customer_created_from", {
      origin: event.origin,
      label: CUSTOMER_CREATION_ORIGIN_LABEL[event.origin],
      partyKind: event.partyKind,
      partyId: event.partyId,
      at: event.at,
    });
  }

  return event;
}

export function getCustomerCreationOriginCounts(): Partial<
  Record<CustomerCreationOrigin, number>
> {
  return { ...readLedger().counts };
}
