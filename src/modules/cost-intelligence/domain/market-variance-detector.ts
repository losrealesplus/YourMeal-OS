// ============================================================================
// YOURMEAL OS — MARKET VARIANCE DETECTOR (CR-COST-07C)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// "Cero Recálculos Silenciosos: Estudios Versionados e Inmutables."
// ============================================================================

import type { MarketPriceSnapshotEntry } from './product-economics-types';
import type {
  MarketIngredientDelta,
  MarketVarianceCheckResult,
} from './decision-intelligence-types';

export class MarketVarianceDetector {
  /**
   * Compares the version's frozen snapshot against latest observed market prices.
   * NEVER silently modifies existing version data.
   */
  public static checkVariance(
    snapshot: Record<string, MarketPriceSnapshotEntry>,
    currentPrices: Record<string, number> // key = priceId or marketProductId
  ): MarketVarianceCheckResult {
    const impactedIngredients: MarketIngredientDelta[] = [];
    let hasPriceIncreases = false;
    let maxDeltaPercentage = 0;

    for (const [key, entry] of Object.entries(snapshot)) {
      const currentPrice = currentPrices[entry.priceId] ?? currentPrices[entry.marketProductId];
      if (currentPrice !== undefined && Math.abs(currentPrice - entry.unitPrice) > 0.0001) {
        const deltaAmount = Number((currentPrice - entry.unitPrice).toFixed(4));
        const deltaPercentage = Number(
          (((currentPrice - entry.unitPrice) / entry.unitPrice) * 100).toFixed(2)
        );

        if (deltaAmount > 0) {
          hasPriceIncreases = true;
        }

        const absPct = Math.abs(deltaPercentage);
        if (absPct > maxDeltaPercentage) {
          maxDeltaPercentage = absPct;
        }

        impactedIngredients.push({
          ingredientName: entry.sourceName || key,
          marketPriceId: entry.priceId,
          snapshotPrice: entry.unitPrice,
          currentPrice,
          deltaAmount,
          deltaPercentage,
        });
      }
    }

    const isOutdated = impactedIngredients.length > 0;
    let explanation = 'Los precios del estudio coinciden con los precios de mercado actuales.';

    if (isOutdated) {
      const topDelta = impactedIngredients.reduce((prev, curr) =>
        Math.abs(curr.deltaPercentage) > Math.abs(prev.deltaPercentage) ? curr : prev
      );
      const sign = topDelta.deltaAmount > 0 ? '+' : '';
      explanation = `Existen ${impactedIngredients.length} ingrediente(s) con precios de mercado más recientes. La mayor variación es de ${sign}${topDelta.deltaPercentage}% en ${topDelta.ingredientName}. Requiere crear una nueva versión para actualizar.`;
    }

    return {
      isOutdated,
      hasPriceIncreases,
      maxDeltaPercentage,
      impactedIngredients,
      explanation,
    };
  }
}
