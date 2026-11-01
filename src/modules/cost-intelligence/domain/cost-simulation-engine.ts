/**
 * YOURMEAL OS — COST SIMULATION & SCENARIO ENGINE (E9)
 * Pure domain sandbox for evaluating hypothetical cost scenarios.
 * Strict Invariant: Simulation != Reality (Zero mutations to real snapshots/DB).
 */

import { calculateBOMCost } from "./bom-calculator";
import {
  BOMComponent,
  CostBaselineSnapshot,
  HypotheticalVariables,
  ProductionOverheadsConfig,
  ScenarioComparison,
  ScenarioResult,
  SimulatedProductImpact,
} from "./types";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function simulateScenario(
  baseline: CostBaselineSnapshot,
  variables: HypotheticalVariables,
  metadata: { scenarioId: string; name: string; description?: string },
): ScenarioResult {
  if (!baseline || !baseline.products) {
    throw new Error("Invalid baseline snapshot provided for simulation.");
  }

  const supplierDeltas = variables.supplierCostDeltas ?? {};
  const itemDeltas = variables.itemCostDeltas ?? {};
  const overheadDeltas = variables.overheadDeltas ?? {};
  const yieldAdjustments = variables.yieldLossAdjustments ?? {};

  const productImpacts: SimulatedProductImpact[] = baseline.products.map((prod) => {
    const isCalculable = prod.isCalculable !== false;
    const costProvenance =
      prod.costProvenance ?? (prod.bomComponents.length > 0 ? "recipe_catalog" : "incomplete");
    const missingDataReasons =
      prod.missingDataReasons ?? (isCalculable ? [] : ["Faltan datos de escandallo o coste"]);

    if (!isCalculable) {
      return {
        productId: prod.productId,
        productName: prod.productName,
        salesPrice: prod.salesPrice,
        monthlyVolume: prod.monthlyVolume ?? 0,
        currentCost: 0,
        simulatedCost: 0,
        costDelta: 0,
        costDeltaPct: 0,
        currentMarginPct: 0,
        simulatedMarginPct: 0,
        marginDeltaPct: 0,
        currentMonthlyCost: 0,
        simulatedMonthlyCost: 0,
        monthlyProfitImpact: 0,
        costProvenance,
        isCalculable: false,
        missingDataReasons,
        rawMaterialsCost: null,
        grossMarginPct: null,
      };
    }

    // 1. Calculate current baseline cost
    const currentBomCalc = calculateBOMCost(
      prod.productId,
      prod.productName,
      prod.bomComponents,
      prod.overheads,
    );
    const currentCost = currentBomCalc.totalProductionCost;

    // 2. Build simulated components with deltas applied (Deep clone without mutating baseline)
    const simulatedComponents: BOMComponent[] = prod.bomComponents.map((comp) => {
      let unitCost = comp.unitCost;

      // Apply supplier delta if component has matching supplier
      if (comp.supplierId && supplierDeltas[comp.supplierId] !== undefined) {
        const deltaPct = supplierDeltas[comp.supplierId];
        unitCost = round(unitCost * (1 + deltaPct));
      }

      // Apply specific item delta if configured (takes precedence or compounds)
      if (itemDeltas[comp.componentId] !== undefined) {
        const deltaPct = itemDeltas[comp.componentId];
        unitCost = round(unitCost * (1 + deltaPct));
      }

      // Adjust yield/loss if configured
      let yieldLoss = comp.yieldLoss ? { ...comp.yieldLoss } : undefined;
      if (yieldAdjustments[comp.componentId] !== undefined) {
        const currentWaste = yieldLoss?.wastePercentage ?? 0;
        const wasteDelta = yieldAdjustments[comp.componentId];
        const newWaste = Math.max(0, Math.min(0.99, currentWaste + wasteDelta));
        yieldLoss = {
          wastePercentage: newWaste,
          yieldFactor: yieldLoss?.yieldFactor,
        };
      }

      return {
        ...comp,
        unitCost,
        yieldLoss,
      };
    });

    // 3. Build simulated overheads
    const laborDeltaPct = overheadDeltas.laborRateDeltaPct ?? 0;
    const energyDeltaPct = overheadDeltas.energyRateDeltaPct ?? 0;
    const packagingDeltaPct = overheadDeltas.packagingRateDeltaPct ?? 0;
    const logisticsDeltaPct = overheadDeltas.logisticsRateDeltaPct ?? 0;

    const simulatedOverheads: ProductionOverheadsConfig = {
      laborCost: round(prod.overheads.laborCost * (1 + laborDeltaPct)),
      energyCost: round(prod.overheads.energyCost * (1 + energyDeltaPct)),
      packagingCost: round(prod.overheads.packagingCost * (1 + packagingDeltaPct)),
      otherOverheads: round((prod.overheads.otherOverheads ?? 0) * (1 + logisticsDeltaPct)),
    };

    // 4. Calculate simulated cost
    const simulatedBomCalc = calculateBOMCost(
      prod.productId,
      prod.productName,
      simulatedComponents,
      simulatedOverheads,
    );
    const simulatedCost = simulatedBomCalc.totalProductionCost;

    // 5. Impact metrics
    const costDelta = round(simulatedCost - currentCost);
    const costDeltaPct = currentCost > 0 ? round((costDelta / currentCost) * 100, 2) : 0;

    const currentMarginPct =
      prod.salesPrice > 0 ? round(((prod.salesPrice - currentCost) / prod.salesPrice) * 100, 2) : 0;

    const simulatedMarginPct =
      prod.salesPrice > 0
        ? round(((prod.salesPrice - simulatedCost) / prod.salesPrice) * 100, 2)
        : 0;

    const marginDeltaPct = round(simulatedMarginPct - currentMarginPct, 2);

    const monthlyVolume = prod.monthlyVolume ?? 0;
    const currentMonthlyCost = round(currentCost * monthlyVolume);
    const simulatedMonthlyCost = round(simulatedCost * monthlyVolume);
    const monthlyCostDelta = round(simulatedMonthlyCost - currentMonthlyCost);
    // Profit impact is negative if cost increases
    const monthlyProfitImpact = round(-monthlyCostDelta);

    return {
      productId: prod.productId,
      productName: prod.productName,
      salesPrice: prod.salesPrice,
      monthlyVolume,
      currentCost,
      simulatedCost,
      costDelta,
      costDeltaPct,
      currentMarginPct,
      simulatedMarginPct,
      marginDeltaPct,
      currentMonthlyCost,
      simulatedMonthlyCost,
      monthlyProfitImpact,
      costProvenance,
      isCalculable: true,
      missingDataReasons: [],
      rawMaterialsCost: prod.rawMaterialsCost ?? currentBomCalc.rawMaterialsCost,
      grossMarginPct: prod.grossMarginPct ?? null,
    };
  });

  const calculableImpacts = productImpacts.filter((p) => p.isCalculable !== false);
  const totalProductsCount = productImpacts.length;
  const calculableProductsCount = calculableImpacts.length;
  const excludedProductsCount = totalProductsCount - calculableProductsCount;
  const coveragePct =
    totalProductsCount > 0 ? round((calculableProductsCount / totalProductsCount) * 100, 1) : 0;
  const isFullyCalculable = excludedProductsCount === 0;

  const totalCurrentMonthlyCost = round(
    calculableImpacts.reduce((acc, p) => acc + p.currentMonthlyCost, 0),
  );

  const totalSimulatedMonthlyCost = round(
    calculableImpacts.reduce((acc, p) => acc + p.simulatedMonthlyCost, 0),
  );

  const totalMonthlyCostDelta = round(totalSimulatedMonthlyCost - totalCurrentMonthlyCost);
  const totalMonthlyProfitImpact = round(-totalMonthlyCostDelta);

  const avgCostDeltaPct =
    calculableImpacts.length > 0
      ? round(
          calculableImpacts.reduce((acc, p) => acc + p.costDeltaPct, 0) / calculableImpacts.length,
          2,
        )
      : 0;

  const avgMarginDeltaPct =
    calculableImpacts.length > 0
      ? round(
          calculableImpacts.reduce((acc, p) => acc + p.marginDeltaPct, 0) /
            calculableImpacts.length,
          2,
        )
      : 0;

  return {
    scenarioId: metadata.scenarioId,
    name: metadata.name,
    description: metadata.description,
    createdAt: new Date().toISOString(),
    baselineSnapshotId: baseline.snapshotId,
    appliedVariables: variables,
    products: productImpacts,
    summary: {
      totalCurrentMonthlyCost,
      totalSimulatedMonthlyCost,
      totalMonthlyCostDelta,
      totalMonthlyProfitImpact,
      avgCostDeltaPct,
      avgMarginDeltaPct,
      totalProductsCount,
      calculableProductsCount,
      excludedProductsCount,
      coveragePct,
      isFullyCalculable,
    },
  };
}

export function compareScenarios(
  baselineSnapshotId: string,
  scenarios: ScenarioResult[],
): ScenarioComparison {
  const compared = scenarios.map((s) => {
    const avgMarginPct =
      s.products.length > 0
        ? round(s.products.reduce((acc, p) => acc + p.simulatedMarginPct, 0) / s.products.length, 2)
        : 0;

    return {
      scenarioId: s.scenarioId,
      name: s.name,
      totalMonthlyCost: s.summary.totalSimulatedMonthlyCost,
      monthlyProfitImpact: s.summary.totalMonthlyProfitImpact,
      avgMarginPct,
      costDeltaPct: s.summary.avgCostDeltaPct,
    };
  });

  return {
    baselineSnapshotId,
    scenarios: compared,
  };
}
