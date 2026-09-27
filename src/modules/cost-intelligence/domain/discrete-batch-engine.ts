// ============================================================================
// YOURMEAL OS — DISCRETE BATCH ENGINE (CR-COST-07B)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// Physical Batch Ceilings & Financial Surplus Governance
// Constitutional Rules:
// 1. DISCRETE CEILING: Integer batches unless fractional allowed.
// 2. SURPLUS GOVERNANCE: Unconfigured surplus BLOCKS effective sold unit cost.
// ============================================================================

import type { SurplusDestination } from './product-economics-types';
import type { DiscreteBatchResult } from './production-operational-types';

export class DiscreteBatchEngine {
  /**
   * Calculates the batches required and surplus units for a given production demand.
   */
  public static calculateBatches(
    demandUnits: number,
    batchNominalYield: number,
    isFractionalAllowed: boolean,
    surplusDestination: SurplusDestination = 'UNCONFIGURED'
  ): DiscreteBatchResult {
    if (demandUnits <= 0) {
      throw new Error(`Demand units must be strictly positive: received ${demandUnits}`);
    }
    if (batchNominalYield <= 0) {
      throw new Error(
        `Batch nominal yield must be strictly positive: received ${batchNominalYield}`
      );
    }

    let batchesRequired: number;
    if (isFractionalAllowed) {
      batchesRequired = Number((demandUnits / batchNominalYield).toFixed(4));
    } else {
      batchesRequired = Math.ceil(demandUnits / batchNominalYield);
    }

    const unitsProduced = Number((batchesRequired * batchNominalYield).toFixed(4));
    const surplusUnits = Number(Math.max(0, unitsProduced - demandUnits).toFixed(4));

    return {
      demandUnits,
      batchesRequired,
      unitsProduced,
      surplusUnits,
      surplusStatus: surplusDestination,
      isFractional: isFractionalAllowed,
    };
  }

  /**
   * Computes the effective cost per sold unit based on how the surplus is treated.
   * STRICT CONSTITUTIONAL RULE: If surplus > 0 and surplusStatus === 'UNCONFIGURED',
   * returns null. Prohibited from assuming Stock or Waste!
   */
  public static calculateEffectiveCostPerSoldUnit(
    demandUnits: number,
    unitsProduced: number,
    totalDirectCost: number,
    surplusStatus: SurplusDestination
  ): {
    costPerSoldUnit: number | null;
    financialAbsorptionNote: string;
  } {
    if (demandUnits <= 0 || totalDirectCost <= 0) {
      return {
        costPerSoldUnit: 0,
        financialAbsorptionNote: 'Sin demanda o sin coste directo.',
      };
    }

    const surplusUnits = Math.max(0, unitsProduced - demandUnits);

    // Case 1: Exact production without surplus
    if (surplusUnits === 0) {
      return {
        costPerSoldUnit: Number((totalDirectCost / demandUnits).toFixed(4)),
        financialAbsorptionNote: 'Producción exacta sin excedentes.',
      };
    }

    // Case 2: Surplus exists but destination is UNCONFIGURED
    if (surplusStatus === 'UNCONFIGURED') {
      return {
        costPerSoldUnit: null, // CONSTITUTIONAL BLOCK: PROHIBITED FROM GUESSING
        financialAbsorptionNote: `Excedente de ${surplusUnits} unidades con destino no configurado; coste efectivo por ración vendida retenido.`,
      };
    }

    // Case 3: MERMA_DESPERDICIO (Waste)
    // The entire cost of the run is absorbed by the sold demand
    if (surplusStatus === 'MERMA_DESPERDICIO') {
      const penalizedCost = Number((totalDirectCost / demandUnits).toFixed(4));
      return {
        costPerSoldUnit: penalizedCost,
        financialAbsorptionNote: `Excedente de ${surplusUnits} unidades asumido como merma (absorbido 100% por demanda vendida).`,
      };
    }

    // Case 4: STOCK_REFRIGERADO or STOCK_CONGELADO (Inventory Asset)
    // The cost of the surplus is deferred into finished goods inventory
    if (surplusStatus === 'STOCK_REFRIGERADO' || surplusStatus === 'STOCK_CONGELADO') {
      const unitCost = Number((totalDirectCost / unitsProduced).toFixed(4));
      return {
        costPerSoldUnit: unitCost,
        financialAbsorptionNote: `Excedente de ${surplusUnits} unidades conservado como ${surplusStatus} (coste unitario preservado).`,
      };
    }

    // Case 5: VENTA_POSTERIOR or CONSUMO_INTERNO
    const standardCost = Number((totalDirectCost / unitsProduced).toFixed(4));
    return {
      costPerSoldUnit: standardCost,
      financialAbsorptionNote: `Excedente de ${surplusUnits} unidades asignado a ${surplusStatus}.`,
    };
  }
}
