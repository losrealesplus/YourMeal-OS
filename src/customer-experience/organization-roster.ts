/**
 * CX004 — Experience-layer organization roster.
 *
 * Durable employee↔organization membership is not opened on the Facade.
 * Session roster lets the operator add workers and keep working (PRODUCT LAW 001).
 */

export type OrganizationWorker = {
  partyId: string;
  displayName: string;
  phone: string | null;
  addedAt: string;
};

export type OrganizationRoster = {
  organizationId: string;
  organizationName: string;
  workers: OrganizationWorker[];
};

const STORAGE_KEY = "ymos.cx.organization_roster.v1";

type Ledger = Record<string, OrganizationRoster>;

let memoryLedger: Ledger = {};

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

export function ensureOrganizationRoster(input: {
  organizationId: string;
  organizationName: string;
}): OrganizationRoster {
  const ledger = readLedger();
  const existing = ledger[input.organizationId];
  if (existing) {
    if (existing.organizationName !== input.organizationName) {
      existing.organizationName = input.organizationName;
      writeLedger(ledger);
    }
    return existing;
  }
  const created: OrganizationRoster = {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    workers: [],
  };
  ledger[input.organizationId] = created;
  writeLedger(ledger);
  return created;
}

export function getOrganizationRoster(
  organizationId: string,
): OrganizationRoster | null {
  return readLedger()[organizationId] ?? null;
}

export function addWorkerToOrganization(input: {
  organizationId: string;
  organizationName: string;
  partyId: string;
  displayName: string;
  phone?: string | null;
}): OrganizationRoster {
  const roster = ensureOrganizationRoster({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  if (!roster.workers.some((w) => w.partyId === input.partyId)) {
    roster.workers = [
      {
        partyId: input.partyId,
        displayName: input.displayName,
        phone: input.phone ?? null,
        addedAt: new Date().toISOString(),
      },
      ...roster.workers,
    ];
    const ledger = readLedger();
    ledger[input.organizationId] = roster;
    writeLedger(ledger);
  }
  return roster;
}
