/**
 * INTERNAL — map operational list items → Order Capability contracts.
 */

import type { OperationalOrderListItem } from "@/modules/operations";
import { DomainError } from "@/domain/errors";
import type {
  OrderCommandResult,
  OrderContext,
  OrderError,
  OrderErrorCode,
  OrderResult,
  OrderStatus,
  OrderSummary,
} from "./OrderContext";

export type OrderCapabilityBits = {
  canRead: boolean;
  canWrite: boolean;
  canConfirm: boolean;
  canKitchen: boolean;
  canLogistics: boolean;
};

export function mapListItemToSummary(
  row: OperationalOrderListItem,
): OrderSummary {
  const partyKind =
    row.demandChannel === "company" && row.companyId
      ? ("company_account" as const)
      : ("individual" as const);
  const partyId =
    partyKind === "company_account"
      ? (row.companyId as string)
      : row.customerId;
  const displayName =
    partyKind === "company_account"
      ? row.companyName ?? row.customerName ?? "Empresa"
      : row.customerName ?? row.customerEmail ?? "Cliente";

  return {
    id: row.id,
    week: { weekStart: row.weekStart },
    status: row.status as OrderStatus,
    demandChannel: row.demandChannel,
    orderSource: "unknown",
    partyRef: {
      kind: partyKind,
      id: partyId,
      displayName,
    },
    deliveryDayPrimary: row.deliveryDates[0] ?? null,
    itemCount: row.items.reduce((s, i) => s + i.qty, 0),
    total: row.total,
    currency: "EUR",
    tenantId: row.tenantId,
  };
}

export function mapListItemToContext(
  row: OperationalOrderListItem,
  permissions: OrderCapabilityBits,
): OrderContext {
  const summary = mapListItemToSummary(row);
  const lines = row.items.map((i) => ({
    id: i.id,
    dayDate: i.dayDate,
    dishId: i.dishId,
    dishName: i.dishName ?? "Plato",
    quantity: i.qty,
    modifications: i.notes ? [i.notes] : undefined,
  }));

  return {
    details: {
      summary,
      lines,
      deliverySlots: row.deliveryDates.map((dayDate) => ({
        dayDate,
        deliveryLocation: row.siteId
          ? {
              kind: "company_site" as const,
              siteId: row.siteId,
              deliveryGroupId: row.deliveryGroupId,
            }
          : { kind: "unresolved" as const },
      })),
      menuRef: { weeklyMenuId: null, weekStart: row.weekStart },
      billing: {
        billable: row.status === "delivered" || row.status === "confirmed",
        invoiced: false,
        invoiceIds: [],
      },
      constraints: { allergens: [], modifications: [] },
      timeline: [
        { key: "draft", label: "Borrador", reached: true },
        {
          key: "confirmed",
          label: "Confirmado",
          reached: row.status !== "draft" && row.status !== "cancelled",
        },
        {
          key: "in_production",
          label: "En producción",
          reached: [
            "in_production",
            "prepared",
            "ready_for_delivery",
            "out_for_delivery",
            "delivered",
          ].includes(row.status),
        },
        {
          key: "delivered",
          label: "Entregado",
          reached: row.status === "delivered",
        },
      ],
    },
    permissions,
    customerContextRef: {
      partyKind: summary.partyRef.kind,
      partyId: summary.partyRef.id,
    },
  };
}

export function mapDomainError(err: unknown): OrderError {
  if (err instanceof DomainError) {
    return {
      code: domainCodeToOrder(err.code),
      message: err.message,
      recoverable:
        err.code === "PERMISSION_DENIED" || err.code === "UNIMPLEMENTED",
      evidence: err.details,
    };
  }
  if (err && typeof err === "object" && "message" in err) {
    return {
      code: "UNKNOWN",
      message: String((err as { message: unknown }).message),
      recoverable: false,
    };
  }
  return { code: "UNKNOWN", message: String(err), recoverable: false };
}

function domainCodeToOrder(code: DomainError["code"]): OrderErrorCode {
  switch (code) {
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "MENU_LOCKED":
      return "MENU_NOT_PUBLISHED";
    case "INVALID_STATE":
    case "ORDER_CLOSED":
      return "INVALID_STATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  command: string,
  evidence?: Record<string, unknown>,
): OrderError {
  return {
    code: "UNIMPLEMENTED",
    message: `${command} substrate not available yet — facade exposes process intent only`,
    recoverable: true,
    evidence,
  };
}

export function failCommand(
  errors: OrderError[],
  orderId: string | null = null,
): OrderCommandResult {
  return {
    ok: false,
    orderId,
    status: null,
    context: null,
    errors,
  };
}

export function failResult(errors: OrderError[]): OrderResult {
  return { ok: false, context: null, errors };
}

export function okCommand(
  orderId: string,
  status: OrderStatus,
  context: OrderContext | null = null,
): OrderCommandResult {
  return { ok: true, orderId, status, context, errors: [] };
}
