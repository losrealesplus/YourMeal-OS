/**
 * OE001 — Experience-layer operational commitments.
 *
 * Staff PlanWeeklyOrder + targetCustomerId returns UNIMPLEMENTED (CAP-008).
 * Until Product opens staff intake substrate, commitments live here so the
 * operator can finish the phone conversation (PRODUCT LAW 001 · Manifesto).
 *
 * Session continuity only — not a second Order database.
 */

export type CommitmentItem = {
  dishId: string;
  label: string;
  qty: number;
};

export type OperationalCommitment = {
  id: string;
  customerId: string;
  customerKind: "individual" | "company_account";
  customerName: string;
  deliveryDay: string;
  weekStart: string;
  items: CommitmentItem[];
  instructions: string;
  channel: "phone" | "admin" | "whatsapp" | "in_person";
  persistence: "facade" | "experience_session";
  facadeOrderId?: string | null;
  createdAt: string;
};

const STORAGE_KEY = "ymos.oe.operational_commitments.v1";

let memory: OperationalCommitment[] = [];

function readAll(): OperationalCommitment[] {
  if (typeof sessionStorage === "undefined") {
    return [...memory];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...memory];
    const parsed = JSON.parse(raw) as OperationalCommitment[];
    return Array.isArray(parsed) ? parsed : [...memory];
  } catch {
    return [...memory];
  }
}

function writeAll(rows: OperationalCommitment[]) {
  memory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* quota / private mode — memory still holds */
  }
}

export function mondayIso(from = new Date()): string {
  const x = new Date(from);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

/** Next N calendar days (ISO dates) for conversation day picker. */
export function upcomingDeliveryDays(count = 7, from = new Date()): string[] {
  const days: string[] = [];
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < count + 3 && days.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wd = d.getDay();
    if (wd === 0) continue; // skip Sunday for food ops default
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function formatDayLabel(iso: string, locale = "es-ES"): string {
  const d = new Date(`${iso}T12:00:00`);
  const weekday = d.toLocaleDateString(locale, { weekday: "short" });
  const day = d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  return `${weekday} ${day}`;
}

export function saveOperationalCommitment(
  input: Omit<OperationalCommitment, "id" | "createdAt">,
): OperationalCommitment {
  const row: OperationalCommitment = {
    ...input,
    id: `oc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [row, ...readAll()].slice(0, 40);
  writeAll(next);
  return row;
}

export function listOperationalCommitments(
  customerId?: string,
): OperationalCommitment[] {
  const all = readAll();
  if (!customerId) return all;
  return all.filter((c) => c.customerId === customerId);
}

/** OE003 — update a session commitment in place (Experience honesty). */
export function updateOperationalCommitment(
  id: string,
  patch: Partial<
    Pick<
      OperationalCommitment,
      "deliveryDay" | "instructions" | "items" | "weekStart"
    >
  >,
): OperationalCommitment | null {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const updated: OperationalCommitment = { ...rows[idx]!, ...patch };
  const next = [...rows];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function clearOperationalCommitmentsForTests() {
  memory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
