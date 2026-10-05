import { operationalItemIdentity } from "@/modules/orders/domain/order-item-read-model";
/**
 * CR-OPS-07: Operational Date Resolver & Normalizer
 * Resolves temporal modes (historical/present/future) relative to operational timezone (Europe/Madrid),
 * applies strict historical snapshot resolution policies, and produces NormalizedOperationalLine[].
 */

import type {
  DateResolverQuery,
  HistoricalResolutionStatus,
  NormalizedOperationalLine,
  OperationalLineIdentity,
  OperationalTemporalMode,
} from "./operational-engine-types";
import type { OperationalOrderListItem } from "../infrastructure/operations-repository";
import type { EUAllergenDef } from "@/types/dietary";
import { EU_ALLERGENS } from "@/types/dietary";

export const DEFAULT_OPERATIONAL_TIMEZONE = "Europe/Madrid";

export const HISTORICAL_QUEUE_STATUSES = [
  "confirmed",
  "kitchen_pending",
  "in_preparation",
  "prepared",
  "ready_for_delivery",
  "in_transit",
  "delivered",
  "completed",
] as const;

export const LIVE_QUEUE_STATUSES = [
  "confirmed",
  "kitchen_pending",
  "in_preparation",
  "prepared",
] as const;

/**
 * Resolves the operational "today" date string in the target timezone (YYYY-MM-DD).
 */
export function getOperationalToday(timezone: string = DEFAULT_OPERATIONAL_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    // Fallback to UTC ISO string date
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Determines whether a target date is historical, present, or future in the operational timezone.
 */
export function resolveTemporalMode(
  targetDate: string,
  timezone: string = DEFAULT_OPERATIONAL_TIMEZONE,
): OperationalTemporalMode {
  const today = getOperationalToday(timezone);
  if (targetDate < today) return "historical";
  if (targetDate === today) return "present";
  return "future";
}

/**
 * Extracts critical allergens present in both the customer's declared allergens and the dish.
 */
export function extractCriticalSafetyAllergens(
  customerAllergens: string[],
  dishAllergens: string[],
): string[] {
  const customerSet = new Set(customerAllergens.map((a) => a.toLowerCase().trim()));
  return dishAllergens.filter((da) => customerSet.has(da.toLowerCase().trim()));
}

/**
 * Maps raw OperationalOrderListItem rows into NormalizedOperationalLine[] with explicit portion indexing.
 */
export function normalizeOperationalOrders(params: {
  orders: OperationalOrderListItem[];
  targetDate: string;
  temporalMode: OperationalTemporalMode;
  dishMetaMap?: Map<
    string,
    { allergens: string[]; weightG?: number | null; prepMinutes?: number | null }
  >;
}): {
  lines: NormalizedOperationalLine[];
  resolutionStatus: HistoricalResolutionStatus;
  warnings: string[];
} {
  const { orders, targetDate, temporalMode, dishMetaMap = new Map() } = params;
  const lines: NormalizedOperationalLine[] = [];
  const warnings: string[] = [];
  let missingSnapshotCount = 0;

  for (const order of orders) {
    const dietarySnapshot = order.dietarySnapshot;
    const hasDietarySnapshot = Boolean(dietarySnapshot && dietarySnapshot.capturedAt);

    if (temporalMode === "historical" && !hasDietarySnapshot) {
      missingSnapshotCount++;
      warnings.push(
        `Pedido #${order.id.slice(0, 8)} (${order.customerName ?? "Cliente"}) carece de dietary_snapshot histórico.`,
      );
    }

    const customerAllergens = dietarySnapshot?.allergens ?? [];
    const customAllergens = dietarySnapshot?.customAllergens ?? [];
    const preferences = dietarySnapshot?.preferences ?? [];
    const itemModificationsFromComment = (comment: string | null): string[] => {
      if (!comment || !comment.trim()) return [];
      return [comment.trim()];
    };

    // Location resolution
    const municipality =
      (order.siteAddress ? extractMunicipality(order.siteAddress) : null) ??
      "Santa Cruz de Tenerife"; // Default local operational region

    const deliveryAddress = {
      street: order.siteAddress ?? "Dirección de entrega",
      city: municipality,
      zip: "38001",
      fullFormatted: order.siteAddress ?? municipality,
    };

    for (const item of order.items) {
      if (item.dayDate !== targetDate) continue;

      const meta = item.dishId === null ? undefined : dishMetaMap.get(item.dishId);
      const dishAllergens = item.line?.allergensSnapshot ?? meta?.allergens ?? [];
      const criticalSafetyAllergens = extractCriticalSafetyAllergens(
        customerAllergens,
        dishAllergens,
      );

      const qty = item.qty || 1;
      for (let pIdx = 0; pIdx < qty; pIdx++) {
        const identity: OperationalLineIdentity = {
          operationalDate: targetDate,
          orderId: order.id,
          orderItemId: item.id,
          dishId: item.dishId,
          portionIndex: pIdx,
          itemIdentity:
            item.line?.identity ??
            operationalItemIdentity({ dishId: item.dishId, orderItemId: item.id }),
          itemKind: item.line?.kind ?? "dish",
        };

        lines.push({
          identity,
          orderStatus: order.status,
          demandChannel: order.demandChannel ?? "individual",
          customerId: order.customerId,
          customerName: order.customerName ?? `Cliente ${order.customerId.slice(0, 8)}`,
          customerPhone: null,
          customerEmail: order.customerEmail,
          municipality,
          deliveryAddress,
          companyId: order.companyId,
          companyName: order.companyName,
          siteId: order.siteId,
          siteName: order.siteName,
          organizationalUnitId: order.organizationalUnitId,
          organizationalUnitName: order.organizationalUnitName,
          deliveryGroupId: order.deliveryGroupId,
          dishName:
            item.line?.name ??
            item.dishName ??
            (meta ? `Plato ${item.dishId?.slice(0, 8) ?? ""}` : "Plato sin nombre"),
          qty: 1, // Normalized to single portion per line
          unitPrice: item.unitPrice ?? null,
          dishAllergens,
          allergenSnapshotState: item.line?.allergenState ?? "HISTORICAL_UNAVAILABLE",
          metadataSource: item.line?.metadataSource ?? "current_catalogue",
          customerAllergens,
          customAllergens,
          criticalSafetyAllergens,
          modifications: itemModificationsFromComment(item.notes),
          preferences,
          itemNotes: item.notes,
          isHistoricalSnapshot: temporalMode === "historical" && hasDietarySnapshot,
          snapshotCapturedAt: item.line?.snapshotCapturedAt ?? dietarySnapshot?.capturedAt ?? null,
          resolutionStatus:
            temporalMode === "historical"
              ? hasDietarySnapshot
                ? "COMPLETE"
                : "INCOMPLETE_SNAPSHOT"
              : "COMPLETE",
          resolutionWarnings:
            item.line?.kind === "custom"
              ? ["PERSONALIZADO", "Receta no vinculada", "Alérgenos sin declarar"]
              : [],
        });
      }
    }
  }

  let overallResolutionStatus: HistoricalResolutionStatus = "COMPLETE";
  if (temporalMode === "historical" && missingSnapshotCount > 0) {
    overallResolutionStatus = "INCOMPLETE_SNAPSHOT";
  }

  return {
    lines,
    resolutionStatus: overallResolutionStatus,
    warnings,
  };
}

function extractMunicipality(address: string): string {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1] || parts[0];
  }
  return address;
}
