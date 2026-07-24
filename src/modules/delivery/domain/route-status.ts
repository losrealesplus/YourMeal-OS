/**
 * Delivery module — domain constants
 * Capability: logistics.operate  ·  Core Object: Route
 */
import type { Database } from "@/integrations/supabase/types";

export type RouteStatus = Database["public"]["Enums"]["route_status"];

export const ROUTE_STATUSES: RouteStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
];

export const ROUTE_STATUS_LABEL_ES: Record<RouteStatus, string> = {
  planned: "Planificada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function routeStatusLabel(s: RouteStatus | string): string {
  return ROUTE_STATUS_LABEL_ES[s as RouteStatus] ?? s;
}

const ROUTE_TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function nextRouteStatuses(from: RouteStatus): RouteStatus[] {
  return ROUTE_TRANSITIONS[from] ?? [];
}
