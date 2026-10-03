/**
 * CR-OPS-07: Production Kitchen Engine (P1 Cocina)
 * Pure transformation over NormalizedOperationalLine[] to produce
 * the kitchen consolidated sheet with strict food safety segregation.
 */

import type {
  HistoricalResolutionStatus,
  KitchenDishConsolidatedBlock,
  KitchenProductionSheetModel,
  KitchenSafetyAlertBanner,
  NormalizedOperationalLine,
  OperationalTemporalMode,
  ProductionPortionVariant,
  SafetySeverity,
  VersionMetadata,
} from "./operational-engine-types";
import { EU_ALLERGENS } from "@/types/dietary";

function formatAllergenName(allergenId: string): string {
  const found = EU_ALLERGENS.find((a) => a.id.toLowerCase() === allergenId.toLowerCase());
  return found ? found.label : allergenId;
}

/**
 * Builds the kitchen production sheet with strict 🔴 safety vs 🟡 modification segregation.
 */
export function buildKitchenProductionSheet(params: {
  lines: NormalizedOperationalLine[];
  targetDate: string;
  temporalMode: OperationalTemporalMode;
  resolutionStatus: HistoricalResolutionStatus;
  versionMetadata: VersionMetadata;
}): KitchenProductionSheetModel {
  const { lines, targetDate, temporalMode, resolutionStatus, versionMetadata } = params;

  // 1. Group normalized lines by dishId
  const dishGroups = new Map<string, NormalizedOperationalLine[]>();
  for (const line of lines) {
    const group = dishGroups.get(line.identity.dishId) || [];
    group.push(line);
    dishGroups.set(line.identity.dishId, group);
  }

  const dishes: KitchenDishConsolidatedBlock[] = [];
  const globalAllergenCounts = new Map<string, { count: number; affectedDishes: Set<string> }>();
  let totalAllergyAlertCount = 0;
  let totalModificationCount = 0;

  for (const [dishId, dishLines] of dishGroups.entries()) {
    const firstLine = dishLines[0];
    const dishName = firstLine.dishName;
    const catalogAllergens = firstLine.dishAllergens;

    // Segment portions into variants
    const variantMap = new Map<string, {
      variantKey: string;
      variantLabel: string;
      severity: SafetySeverity;
      allergensAffected: string[];
      modifications: string[];
      customerMap: Map<string, {
        identity: NormalizedOperationalLine["identity"];
        customerId: string;
        customerName: string;
        orderId: string;
        qty: number;
        notes: string | null;
      }>;
    }>();

    let standardCount = 0;
    let safetyAllergyCount = 0;
    let modifiedCount = 0;

    for (const line of dishLines) {
      const hasCriticalAllergens = line.criticalSafetyAllergens.length > 0;
      const hasModifications = line.modifications.length > 0;

      let severity: SafetySeverity = "standard";
      let variantKey = "STD";
      let variantLabel = "Ración Estándar";

      if (hasCriticalAllergens) {
        severity = "critical_allergy";
        safetyAllergyCount++;
        totalAllergyAlertCount++;
        const algLabels = line.criticalSafetyAllergens.map(formatAllergenName).join(", ");
        variantKey = `ALG:${line.criticalSafetyAllergens.sort().join("_")}`;
        variantLabel = `🔴 ALERTA: ${algLabels.toUpperCase()}`;

        // Aggregate to global summary
        for (const alg of line.criticalSafetyAllergens) {
          const entry = globalAllergenCounts.get(alg) || { count: 0, affectedDishes: new Set() };
          entry.count++;
          entry.affectedDishes.add(dishName);
          globalAllergenCounts.set(alg, entry);
        }
      } else if (hasModifications) {
        severity = "modification";
        modifiedCount++;
        totalModificationCount++;
        const modLabels = line.modifications.join(" · ");
        variantKey = `MOD:${line.modifications.sort().join("_")}`;
        variantLabel = `🟡 MODIFICACIÓN: ${modLabels}`;
      } else {
        standardCount++;
      }

      const existingVariant = variantMap.get(variantKey) || {
        variantKey,
        variantLabel,
        severity,
        allergensAffected: line.criticalSafetyAllergens,
        modifications: line.modifications,
        customerMap: new Map(),
      };

      const custEntry = existingVariant.customerMap.get(line.customerId) || {
        identity: line.identity,
        customerId: line.customerId,
        customerName: line.customerName,
        orderId: line.identity.orderId,
        qty: 0,
        notes: line.itemNotes,
      };
      custEntry.qty += 1;
      existingVariant.customerMap.set(line.customerId, custEntry);
      variantMap.set(variantKey, existingVariant);
    }

    const variants: ProductionPortionVariant[] = Array.from(variantMap.values()).map((v) => {
      const customerLines = Array.from(v.customerMap.values());
      const totalQty = customerLines.reduce((sum, c) => sum + c.qty, 0);
      return {
        variantKey: v.variantKey,
        variantLabel: v.variantLabel,
        severity: v.severity,
        qty: totalQty,
        allergensAffected: v.allergensAffected,
        modifications: v.modifications,
        customerLines,
      };
    });

    // Sort variants: critical_allergy first, then modification, then standard
    variants.sort((a, b) => {
      const severityOrder: Record<SafetySeverity, number> = {
        critical_allergy: 0,
        modification: 1,
        standard: 2,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    dishes.push({
      dishId,
      dishName,
      totalQty: dishLines.length,
      catalogAllergens,
      prepMinutesEstimated: null,
      totalWeightGramsEstimated: null,
      standardPortionsCount: standardCount,
      safetyAllergyPortionsCount: safetyAllergyCount,
      modifiedPortionsCount: modifiedCount,
      variants,
    });
  }

  // Sort dishes by totalQty descending
  dishes.sort((a, b) => b.totalQty - a.totalQty);

  const criticalAllergensPresent = Array.from(globalAllergenCounts.entries()).map(([algId, info]) => ({
    allergenId: algId,
    allergenLabel: formatAllergenName(algId),
    affectedPortions: info.count,
    affectedDishes: Array.from(info.affectedDishes),
  }));

  const safetySummary: KitchenSafetyAlertBanner = {
    totalAllergyAlertCount,
    totalModificationCount,
    criticalAllergensPresent,
  };

  const distinctOrderIds = new Set(lines.map((l) => l.identity.orderId));

  return {
    targetDate,
    temporalMode,
    resolutionStatus,
    versionMetadata,
    safetySummary,
    dishes,
    totalPortions: lines.length,
    totalOrders: distinctOrderIds.size,
  };
}
