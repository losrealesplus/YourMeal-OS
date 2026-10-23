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
  confirmed: "Confirmado",
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

export const ROLLBACK_TRANSITIONS: Partial<
  Record<OperationalOrderStatus, OperationalOrderStatus>
> = {
  prepared: "in_production",
  in_production: "confirmed",
  ready_for_delivery: "prepared",
};

function isTestEnvironment(): boolean {
  try {
    if (import.meta.env?.PROD || import.meta.env?.MODE === "production") {
      return false;
    }
  } catch {
    // ignore
  }
  if (typeof process !== "undefined") {
    if (process.env?.NODE_ENV === "production") {
      return false;
    }
    if (process.env?.NODE_ENV === "test" || process.env?.VITEST !== undefined) {
      return true;
    }
  }
  try {
    if (import.meta.env?.MODE === "test") {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function readBooleanFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

function getRollbackEnvFlag(): boolean | undefined {
  // Vite embeds this value into both browser and SSR bundles at build time.
  // Runtime Worker variables must not disagree with the browser's compiled flag.
  try {
    const flag = readBooleanFlag(import.meta.env?.VITE_OPERATIONAL_ROLLBACK_ENABLED);
    if (flag !== undefined) return flag;
  } catch {}
  if (isTestEnvironment() && typeof process !== "undefined") {
    return readBooleanFlag(process.env?.VITE_OPERATIONAL_ROLLBACK_ENABLED);
  }
  return undefined;
}

let _featureOperationalRollbackEnabled = false;

/**
 * Flag de aislamiento para retroceso de estado operacional (Marcha atrás).
 *
 * Permanece HARD_DISABLED (false) por defecto en todos los entornos para garantizar cero mutaciones
 * hasta que se autorice y despliegue el procedimiento almacenado atómico PostgreSQL
 * (cr_order_rollback_v1) en una migración dedicada.
 *
 * MECANISMO DE ACTIVACIÓN CONTROLADA POST-MIGRACIÓN:
 * Para activar el retroceso en producción o staging de forma explícita y controlada tras el
 * despliegue de la migración SQL 20261022081500_cr_order_rollback_v1_rpc.sql, se debe configurar:
 *   VITE_OPERATIONAL_ROLLBACK_ENABLED="true"
 * en el entorno de compilación Vite, generando y publicando un artefacto nuevo.
 * Cambiar solo una variable runtime del Worker no activa el bundle del navegador.
 *
 * En suites de prueba automatizadas (Vitest / NODE_ENV=test), también puede activarse
 * programáticamente mediante setOperationalRollbackEnabledForTests(true).
 */
export function isOperationalRollbackEnabled(): boolean {
  // 1. Prioridad: Flag de entorno explícito (mecanismo formal para activación post-migración)
  const envFlag = getRollbackEnvFlag();
  if (envFlag !== undefined) {
    return envFlag;
  }

  // 2. Entorno de pruebas: permite control local de tests
  if (isTestEnvironment()) {
    return _featureOperationalRollbackEnabled;
  }

  // 3. Fallback estricto de seguridad: HARD_DISABLED
  return false;
}

/**
 * Permite alternar el flag exclusivamente en entornos de prueba automatizados (Vitest / NODE_ENV=test).
 * En entornos de producción o fuera de test, falla de forma estricta (fail-closed) para garantizar
 * que ninguna invocación en tiempo de ejecución productivo pueda activar el retroceso sin la variable de entorno.
 */
export function setOperationalRollbackEnabledForTests(enabled: boolean): void {
  if (!isTestEnvironment()) {
    throw new Error(
      "setOperationalRollbackEnabledForTests está estrictamente restringido a entornos de prueba (NODE_ENV=test / VITEST). No se puede invocar en producción.",
    );
  }
  _featureOperationalRollbackEnabled = enabled;
}

export const FEATURE_OPERATIONAL_ROLLBACK_ENABLED = false;

export const ROLLBACK_LABEL_ES: Partial<
  Record<OperationalOrderStatus, string>
> = {
  prepared: "Volver a En preparación",
  in_production: "Volver a Confirmado",
  ready_for_delivery: "Volver a Preparado",
};

export function getRollbackStatus(
  from: OperationalOrderStatus,
): OperationalOrderStatus | null {
  return ROLLBACK_TRANSITIONS[from] ?? null;
}

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

/** Snapshot confirmed by the operator; the RPC revalidates it under lock. */
export type OperationalRollbackScope = {
  expectedStatus?: OperationalOrderStatus;
  expectedRevision?: number;
  expectedDeliveryDates?: string[];
  allowMultiDay?: boolean;
  operatingDate?: string;
};
