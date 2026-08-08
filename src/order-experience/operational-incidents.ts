/**
 * OE005 — Experience-layer Operational Incidents.
 *
 * Orders records the exception and routes it — does not solve every domain.
 * Session continuity until Product opens durable incident substrate.
 * Not a second Capability. Not OCC (Reserved).
 */

export type IncidentType =
  | "customer_change"
  | "kitchen_issue"
  | "delivery_issue"
  | "allergy_issue"
  | "address_issue"
  | "missing_item"
  | "late_preparation"
  | "operational_clarification";

export type IncidentRoute =
  | "customer_service"
  | "kitchen"
  | "delivery"
  | "production"
  | "billing_future"
  | "supervisor_future";

export type IncidentStatus =
  | "recorded"
  | "routed"
  | "in_progress"
  | "resolved"
  | "cancelled";

export type IncidentPriority = "normal" | "high" | "urgent";

export type OperationalIncident = {
  id: string;
  orderRef: string;
  orderSource: "facade" | "session" | "unknown";
  customerId: string;
  customerName: string;
  deliveryDay: string | null;
  deliveryArea: string | null;
  type: IncidentType;
  route: IncidentRoute;
  status: IncidentStatus;
  priority: IncidentPriority;
  notes: string;
  createdAt: string;
  routedAt?: string | null;
};

const STORAGE_KEY = "ymos.oe.operational_incidents.v1";

let memory: OperationalIncident[] = [];

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  customer_change: "Cambio del cliente",
  kitchen_issue: "Incidencia cocina",
  delivery_issue: "Incidencia reparto",
  allergy_issue: "Alergia / dieta",
  address_issue: "Dirección",
  missing_item: "Falta ítem",
  late_preparation: "Preparación tarde",
  operational_clarification: "Aclaración operativa",
};

export const INCIDENT_ROUTE_LABEL: Record<IncidentRoute, string> = {
  customer_service: "Atención al cliente",
  kitchen: "Cocina",
  delivery: "Reparto",
  production: "Producción",
  billing_future: "Facturación (futuro)",
  supervisor_future: "Supervisor (futuro)",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  recorded: "Registrada",
  routed: "Derivada",
  in_progress: "En curso",
  resolved: "Resuelta",
  cancelled: "Cancelada",
};

/** Default route suggestion from incident type — operator can override. */
export function suggestedRoute(type: IncidentType): IncidentRoute {
  switch (type) {
    case "customer_change":
    case "operational_clarification":
      return "customer_service";
    case "kitchen_issue":
    case "allergy_issue":
    case "missing_item":
    case "late_preparation":
      return "kitchen";
    case "delivery_issue":
    case "address_issue":
      return "delivery";
    default:
      return "customer_service";
  }
}

function readAll(): OperationalIncident[] {
  if (typeof sessionStorage === "undefined") {
    return [...memory];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...memory];
    const parsed = JSON.parse(raw) as OperationalIncident[];
    return Array.isArray(parsed) ? parsed : [...memory];
  } catch {
    return [...memory];
  }
}

function writeAll(rows: OperationalIncident[]) {
  memory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function listOperationalIncidents(orderRef?: string): OperationalIncident[] {
  const all = readAll();
  const filtered = orderRef
    ? all.filter((i) => i.orderRef === orderRef)
    : all;
  return [...filtered].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function saveOperationalIncident(
  input: Omit<
    OperationalIncident,
    "id" | "createdAt" | "status" | "routedAt"
  > & { status?: IncidentStatus },
): OperationalIncident {
  const status = input.status ?? "recorded";
  const row: OperationalIncident = {
    ...input,
    id: `oi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    status,
    createdAt: new Date().toISOString(),
    routedAt: status === "routed" || status === "in_progress" ? new Date().toISOString() : null,
  };
  writeAll([row, ...readAll()].slice(0, 80));
  return row;
}

export function routeOperationalIncident(
  id: string,
  route: IncidentRoute,
): OperationalIncident | null {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const updated: OperationalIncident = {
    ...rows[idx]!,
    route,
    status: "routed",
    routedAt: new Date().toISOString(),
  };
  const next = [...rows];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function clearOperationalIncidentsForTests() {
  memory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
