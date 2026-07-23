/**
 * Operational order statuses — kitchen & delivery spine (pilot).
 * Maps DB enum ↔ UI labels. Draft stays customer-side only.
 */

export type OperationalOrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "prepared"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "delivery_issue"
  | "cancelled";

/** Alias used by UI layers */
export type OperationalStatus = OperationalOrderStatus;

export const KITCHEN_QUEUE_STATUSES: OperationalOrderStatus[] = [
  "confirmed",
  "in_production",
  "prepared",
];

export const DELIVERY_QUEUE_STATUSES: OperationalOrderStatus[] = [
  "ready_for_delivery",
  "out_for_delivery",
  "delivery_issue",
];

export const STATUS_LABEL_ES: Record<OperationalOrderStatus, string> = {
  draft: "Borrador",
  confirmed: "Pendiente",
  in_production: "En preparación",
  prepared: "Preparado",
  ready_for_delivery: "Listo para reparto",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  delivery_issue: "Incidencia",
  cancelled: "Cancelado",
};

/** Timeline steps shown on order detail (operational). */
export const OPERATIONAL_TIMELINE: OperationalOrderStatus[] = [
  "confirmed",
  "in_production",
  "prepared",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];

export const TIMELINE_LABEL_ES: Record<string, string> = {
  confirmed: "Confirmado",
  in_production: "En preparación",
  prepared: "Preparado",
  ready_for_delivery: "Listo para reparto",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
};

const KITCHEN_TRANSITIONS: Partial<
  Record<OperationalOrderStatus, OperationalOrderStatus[]>
> = {
  confirmed: ["in_production"],
  in_production: ["prepared"],
  prepared: ["ready_for_delivery"],
};

const DELIVERY_TRANSITIONS: Partial<
  Record<OperationalOrderStatus, OperationalOrderStatus[]>
> = {
  ready_for_delivery: ["out_for_delivery"],
  out_for_delivery: ["delivered", "delivery_issue"],
  delivery_issue: ["out_for_delivery"],
};

export function nextKitchenStatuses(
  from: OperationalOrderStatus,
): OperationalOrderStatus[] {
  return KITCHEN_TRANSITIONS[from] ?? [];
}

export function nextDeliveryStatuses(
  from: OperationalOrderStatus,
): OperationalOrderStatus[] {
  return DELIVERY_TRANSITIONS[from] ?? [];
}

/** UI aliases */
export const kitchenNextStatuses = nextKitchenStatuses;
export const deliveryNextStatuses = nextDeliveryStatuses;

export function operationalStatusLabel(
  status: OperationalOrderStatus | string,
): string {
  return STATUS_LABEL_ES[status as OperationalOrderStatus] ?? status;
}

export function timelineReachedIndex(
  status: OperationalOrderStatus | string,
): number {
  const s = status as OperationalOrderStatus;
  if (s === "delivery_issue") {
    return OPERATIONAL_TIMELINE.indexOf("out_for_delivery");
  }
  if (s === "draft" || s === "cancelled") return -1;
  return OPERATIONAL_TIMELINE.indexOf(s);
}

export type TimelineStepState = "done" | "current" | "upcoming";

export type TimelineStep = {
  key: string;
  label: string;
  state: TimelineStepState;
};

/**
 * Pedido creado → Confirmado → … → Entregado
 */
export function buildOperationalTimeline(
  status: OperationalOrderStatus | string,
): TimelineStep[] {
  const s = status as OperationalOrderStatus;
  const created: TimelineStep = {
    key: "created",
    label: "Pedido creado",
    state:
      s === "draft"
        ? "current"
        : s === "cancelled"
          ? "upcoming"
          : "done",
  };

  const reached = timelineReachedIndex(s);
  const spine: TimelineStep[] = OPERATIONAL_TIMELINE.map((key, i) => {
    let state: TimelineStepState = "upcoming";
    if (reached < 0) {
      state = "upcoming";
    } else if (i < reached) {
      state = "done";
    } else if (i === reached) {
      state = "current";
    }
    return {
      key,
      label: TIMELINE_LABEL_ES[key] ?? key,
      state,
    };
  });

  if (s === "delivery_issue") {
    return [
      created,
      ...spine.map((step) =>
        step.key === "out_for_delivery"
          ? { ...step, state: "current" as const }
          : step.key === "delivered"
            ? { ...step, state: "upcoming" as const }
            : step,
      ),
      {
        key: "delivery_issue",
        label: "Incidencia",
        state: "current",
      },
    ];
  }

  return [created, ...spine];
}
