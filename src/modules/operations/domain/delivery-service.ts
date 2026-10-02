/**
 * CR-OPS-06: DeliveryService Domain Entity
 * Represents an individual physical fulfillment event / bag for a customer on a specific date.
 */
import type { OrderDietarySnapshot } from "@/types/dietary";

export type DeliveryServiceStatus =
  | "pending"
  | "in_production"
  | "prepared"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "delivery_issue"
  | "cancelled";

export type DeliveryAddressSnapshot = {
  addressId?: string | null;
  street?: string;
  city?: string | null;
  zip?: string | null;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
  unresolved?: boolean;
  reason?: string;
};

export type CustomerContactSnapshot = {
  customerId?: string;
  displayName?: string;
  email?: string | null;
  phone?: string | null;
};

export type DeliveryServiceModel = {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  deliveryDate: string;
  status: DeliveryServiceStatus;
  deliveryAddressId: string | null;
  deliveryAddressSnapshot: DeliveryAddressSnapshot;
  customerContactSnapshot: CustomerContactSnapshot;
  dietarySnapshot: OrderDietarySnapshot | null;
  deliveryInstructions: string | null;
  packedAt: string | null;
  packedBy: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  deliveredBy: string | null;
  issueReason: string | null;
  issueNotes: string | null;
  driverNotes: string | null;
  legacyBackfill: boolean;
  createdAt: string;
  updatedAt: string;
};

export const DELIVERY_SERVICE_STATUS_LABEL_ES: Record<DeliveryServiceStatus, string> = {
  pending: "Pendiente",
  in_production: "En preparación",
  prepared: "Preparado",
  ready_for_delivery: "Listo para reparto",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  delivery_issue: "Incidencia",
  cancelled: "Cancelado",
};

export function deliveryServiceStatusLabel(status: DeliveryServiceStatus): string {
  return DELIVERY_SERVICE_STATUS_LABEL_ES[status] ?? status;
}

export function isDeliveryServiceCompleted(status: DeliveryServiceStatus): boolean {
  return status === "delivered" || status === "cancelled";
}

export function isDeliveryServiceActive(status: DeliveryServiceStatus): boolean {
  return !isDeliveryServiceCompleted(status);
}
