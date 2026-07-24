/**
 * EP-002B.2 — Kitchen batch status (production lot = dish × day).
 * Separate from order-level operational spine.
 */

export type KitchenBatchStatus =
  | "pending"
  | "preparing"
  | "plating"
  | "finished";

export const KITCHEN_BATCH_STATUSES: readonly KitchenBatchStatus[] = [
  "pending",
  "preparing",
  "plating",
  "finished",
] as const;

export const KITCHEN_BATCH_STATUS_LABEL_ES: Record<KitchenBatchStatus, string> =
  {
    pending: "Pendiente",
    preparing: "Preparando",
    plating: "Emplatando",
    finished: "Finalizado",
  };

export function kitchenBatchStatusLabel(status: KitchenBatchStatus): string {
  return KITCHEN_BATCH_STATUS_LABEL_ES[status] ?? status;
}

/** Allowed forward transitions for a production lot. */
export function nextKitchenBatchStatuses(
  from: KitchenBatchStatus,
): KitchenBatchStatus[] {
  switch (from) {
    case "pending":
      return ["preparing"];
    case "preparing":
      return ["plating", "finished"];
    case "plating":
      return ["finished"];
    case "finished":
      return [];
    default:
      return [];
  }
}

export function primaryKitchenBatchAction(
  from: KitchenBatchStatus,
): { to: KitchenBatchStatus; label: string } | null {
  switch (from) {
    case "pending":
      return { to: "preparing", label: "Iniciar preparación" };
    case "preparing":
      return { to: "plating", label: "Marcar emplatado" };
    case "plating":
      return { to: "finished", label: "Marcar finalizado" };
    default:
      return null;
  }
}

export function isKitchenBatchStatus(value: string): value is KitchenBatchStatus {
  return (KITCHEN_BATCH_STATUSES as readonly string[]).includes(value);
}
