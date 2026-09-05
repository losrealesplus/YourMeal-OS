/**
 * YOURMEAL OS — COMMERCIAL PRICING ENGINE
 *
 * Evaluates commercial offers, promotions, tier-based eligibility,
 * and optional extras without client-side calculation. Produces rich evaluation
 * results and immutable Order Price Snapshots.
 */

import { MoneyUtil } from "../domain/money";
import type {
  AppliedPromotionDetail,
  CommercialOffer,
  CreatePriceSnapshotOptions,
  CustomerTier,
  ExtraItemEvaluationResult,
  ExtraItemInput,
  Money,
  OrderItemPriceDetail,
  OrderPriceSnapshot,
  PriceEvaluationContext,
  PricingEvaluationResult,
  PromotionRule,
} from "../domain/types";

export const PRICING_ENGINE_VERSION = "1.0.0";

export class CommercialPricingEngine {
  /**
   * Evaluates if a customer tier is eligible for a given promotion rule.
   * - If rule eligibility is 'public', any tier is eligible.
   * - If rule eligibility is specific (e.g. 'subscriber_weekly'), only that specific tier is eligible.
   * - If rule eligibility is an array, checks if the customer tier (or 'public') is included.
   */
  static isEligible(customerTier: CustomerTier, ruleEligibility: PromotionRule["eligibility"]): boolean {
    if (ruleEligibility === "public") return true;
    if (Array.isArray(ruleEligibility)) {
      if (ruleEligibility.includes("public")) return true;
      return ruleEligibility.includes(customerTier);
    }
    return ruleEligibility === customerTier;
  }

  /**
   * Evaluates the base offer with applied promotion rules according to stacking policy.
   */
  static evaluateBaseOffer(
    basePrice: Money,
    promotions: PromotionRule[],
    customerTier: CustomerTier,
  ): {
    finalPrice: Money;
    totalSavings: Money;
    savingsPercentage: number;
    appliedPromotions: AppliedPromotionDetail[];
  } {
    const currency = basePrice.currency;
    const baseCents = basePrice.cents;

    if (baseCents <= 0 || !promotions || promotions.length === 0) {
      return {
        finalPrice: basePrice,
        totalSavings: MoneyUtil.fromCents(0, currency),
        savingsPercentage: 0,
        appliedPromotions: [],
      };
    }

    // Filter rules matching offer_base and customer eligibility
    const eligibleRules = promotions
      .filter((p) => p.appliesTo === "offer_base" && this.isEligible(customerTier, p.eligibility))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    if (eligibleRules.length === 0) {
      return {
        finalPrice: basePrice,
        totalSavings: MoneyUtil.fromCents(0, currency),
        savingsPercentage: 0,
        appliedPromotions: [],
      };
    }

    let runningCents = baseCents;
    const appliedDetails: AppliedPromotionDetail[] = [];

    // Separate non-stackable vs stackable
    const stackableRules = eligibleRules.filter((r) => r.stackable === true);
    const nonStackableRules = eligibleRules.filter((r) => !r.stackable);

    // Stacking Policy:
    // If non-stackable rules exist, we select the one providing the maximum savings.
    // If stackable rules exist, they are applied sequentially to the running amount.
    if (nonStackableRules.length > 0) {
      let bestRule: PromotionRule = nonStackableRules[0];
      let bestDiscountCents = 0;

      for (const rule of nonStackableRules) {
        let discount = 0;
        if (rule.type === "percentage") {
          discount = MoneyUtil.percentageDiscount(baseCents, rule.value);
        } else if (rule.type === "fixed_amount") {
          discount = Math.min(baseCents, Math.round(rule.value));
        } else if (rule.type === "fixed_price") {
          const targetCents = Math.max(0, Math.round(rule.value));
          discount = Math.max(0, baseCents - targetCents);
        }

        if (discount > bestDiscountCents) {
          bestDiscountCents = discount;
          bestRule = rule;
        }
      }

      if (bestDiscountCents > 0) {
        runningCents = Math.max(0, baseCents - bestDiscountCents);
        appliedDetails.push({
          ruleId: bestRule.id,
          code: bestRule.code,
          name: bestRule.name,
          type: bestRule.type,
          value: bestRule.value,
          appliesTo: "offer_base",
          discountCents: bestDiscountCents,
          formattedDiscount: MoneyUtil.format(bestDiscountCents, currency),
        });
      }
    }

    // Apply stackable rules on the remaining amount
    for (const rule of stackableRules) {
      if (runningCents <= 0) break;

      let discount = 0;
      if (rule.type === "percentage") {
        discount = MoneyUtil.percentageDiscount(runningCents, rule.value);
      } else if (rule.type === "fixed_amount") {
        discount = Math.min(runningCents, Math.round(rule.value));
      } else if (rule.type === "fixed_price") {
        const targetCents = Math.max(0, Math.round(rule.value));
        discount = Math.max(0, runningCents - targetCents);
      }

      if (discount > 0) {
        runningCents = Math.max(0, runningCents - discount);
        appliedDetails.push({
          ruleId: rule.id,
          code: rule.code,
          name: rule.name,
          type: rule.type,
          value: rule.value,
          appliesTo: "offer_base",
          discountCents: discount,
          formattedDiscount: MoneyUtil.format(discount, currency),
        });
      }
    }

    const totalSavingsCents = Math.max(0, baseCents - runningCents);
    const savingsPct = MoneyUtil.savingsPercentage(baseCents, totalSavingsCents);

    return {
      finalPrice: MoneyUtil.fromCents(runningCents, currency),
      totalSavings: MoneyUtil.fromCents(totalSavingsCents, currency),
      savingsPercentage: savingsPct,
      appliedPromotions: appliedDetails,
    };
  }

  /**
   * Evaluates an optional extra item against applicable extra promotion rules.
   */
  static evaluateExtraItem(
    item: ExtraItemInput,
    promotions: PromotionRule[],
    customerTier: CustomerTier,
    currency: string = "EUR",
  ): ExtraItemEvaluationResult {
    const qty = Math.max(1, item.qty ?? 1);
    const baseUnitCents = Math.max(0, Math.round(item.basePriceCents));
    const totalBaseCents = baseUnitCents * qty;

    const eligibleRules = promotions
      .filter((p) => p.appliesTo === "extras" && this.isEligible(customerTier, p.eligibility))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    let finalUnitCents = baseUnitCents;
    let appliedRule: PromotionRule | null = null;

    if (eligibleRules.length > 0 && baseUnitCents > 0) {
      let bestRule = eligibleRules[0];
      let bestDiscount = 0;

      for (const rule of eligibleRules) {
        let discount = 0;
        if (rule.type === "percentage") {
          discount = MoneyUtil.percentageDiscount(baseUnitCents, rule.value);
        } else if (rule.type === "fixed_amount") {
          discount = Math.min(baseUnitCents, Math.round(rule.value));
        } else if (rule.type === "fixed_price") {
          const targetCents = Math.max(0, Math.round(rule.value));
          discount = Math.max(0, baseUnitCents - targetCents);
        }

        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestRule = rule;
        }
      }

      if (bestDiscount > 0) {
        finalUnitCents = Math.max(0, baseUnitCents - bestDiscount);
        appliedRule = bestRule;
      }
    }

    const totalFinalCents = finalUnitCents * qty;
    const totalSavingsCents = Math.max(0, totalBaseCents - totalFinalCents);
    const savingsPct = MoneyUtil.savingsPercentage(totalBaseCents, totalSavingsCents);

    return {
      dishId: item.dishId,
      dishName: item.dishName,
      qty,
      baseUnitPrice: MoneyUtil.fromCents(baseUnitCents, currency),
      finalUnitPrice: MoneyUtil.fromCents(finalUnitCents, currency),
      totalBasePrice: MoneyUtil.fromCents(totalBaseCents, currency),
      totalFinalPrice: MoneyUtil.fromCents(totalFinalCents, currency),
      totalSavings: MoneyUtil.fromCents(totalSavingsCents, currency),
      savingsPercentage: savingsPct,
      appliedPromotion: appliedRule,
    };
  }

  /**
   * Main evaluation entry point: evaluates offer, customer tier, applied promotions, and optional extras.
   */
  static evaluate(offer: CommercialOffer, context: PriceEvaluationContext): PricingEvaluationResult {
    const currency = offer.basePrice.currency;
    const customerTier = context.customerTier ?? "public";

    // 1. Evaluate base offer
    const baseEval = this.evaluateBaseOffer(offer.basePrice, offer.promotions, customerTier);

    // 2. Evaluate extras
    const extrasResults: ExtraItemEvaluationResult[] = (context.extras ?? []).map((extra) =>
      this.evaluateExtraItem(extra, offer.promotions, customerTier, currency),
    );

    let extrasTotalBaseCents = 0;
    let extrasTotalFinalCents = 0;
    for (const extra of extrasResults) {
      extrasTotalBaseCents += extra.totalBasePrice.cents;
      extrasTotalFinalCents += extra.totalFinalPrice.cents;
    }
    const extrasTotalSavingsCents = Math.max(0, extrasTotalBaseCents - extrasTotalFinalCents);

    // 3. Compute grand totals
    const grandTotalBaseCents = baseEval.finalPrice.cents > 0 || baseEval.totalSavings.cents > 0
      ? offer.basePrice.cents + extrasTotalBaseCents
      : extrasTotalBaseCents;

    const grandTotalFinalCents = baseEval.finalPrice.cents + extrasTotalFinalCents;
    const grandTotalSavingsCents = Math.max(0, grandTotalBaseCents - grandTotalFinalCents);

    // 4. Generate visual badge
    let pricingBadge: string | null = null;
    if (baseEval.totalSavings.cents > 0) {
      const topRule = baseEval.appliedPromotions[0];
      if (topRule) {
        const customBadge = offer.promotions.find((p) => p.id === topRule.ruleId)?.badgeLabel;
        pricingBadge = customBadge ?? `🟢 Ahorras ${baseEval.totalSavings.formatted} (${baseEval.savingsPercentage}%)`;
      }
    }

    return {
      offerCode: offer.code,
      customerTier,
      basePrice: offer.basePrice,
      finalPrice: baseEval.finalPrice,
      totalSavings: baseEval.totalSavings,
      savingsPercentage: baseEval.savingsPercentage,
      hasDiscount: baseEval.totalSavings.cents > 0,
      appliedPromotions: baseEval.appliedPromotions,
      pricingBadge,
      extrasBreakdown: extrasResults,
      extrasTotalBasePrice: MoneyUtil.fromCents(extrasTotalBaseCents, currency),
      extrasTotalFinalPrice: MoneyUtil.fromCents(extrasTotalFinalCents, currency),
      extrasTotalSavings: MoneyUtil.fromCents(extrasTotalSavingsCents, currency),
      grandTotalBasePrice: MoneyUtil.fromCents(grandTotalBaseCents, currency),
      grandTotalFinalPrice: MoneyUtil.fromCents(grandTotalFinalCents, currency),
      grandTotalSavings: MoneyUtil.fromCents(grandTotalSavingsCents, currency),
    };
  }

  /**
   * Creates an immutable Order Price Snapshot from an evaluation result.
   * Freezes applied discounts and explicit line item details without performing arbitrary total division.
   */
  static createSnapshot(
    evalResult: PricingEvaluationResult,
    options?: CreatePriceSnapshotOptions,
  ): OrderPriceSnapshot {
    const items: OrderItemPriceDetail[] = [];

    // 1. Explicit line items passed by caller (e.g. menu dishes with explicit line pricing)
    if (options?.lineItems && options.lineItems.length > 0) {
      items.push(...options.lineItems);
    }

    // 2. Evaluated extras (itemized directly from evaluation breakdown)
    for (const extra of evalResult.extrasBreakdown) {
      items.push({
        dishId: extra.dishId,
        dishName: extra.dishName,
        itemType: "extra",
        qty: extra.qty,
        basePriceCents: extra.baseUnitPrice.cents,
        finalPriceCents: extra.finalUnitPrice.cents,
        discountCents: Math.max(0, extra.baseUnitPrice.cents - extra.finalUnitPrice.cents),
      });
    }

    return {
      orderId: options?.orderId,
      offerCode: evalResult.offerCode,
      customerTier: evalResult.customerTier,
      baseAmountCents: evalResult.grandTotalBasePrice.cents,
      discountAmountCents: evalResult.grandTotalSavings.cents,
      finalAmountCents: evalResult.grandTotalFinalPrice.cents,
      currency: evalResult.basePrice.currency,
      appliedPromotions: evalResult.appliedPromotions.map((p) => ({
        ruleId: p.ruleId,
        code: p.code,
        name: p.name,
        discountCents: p.discountCents,
        formattedDiscount: p.formattedDiscount,
      })),
      items,
      evaluatedAt: new Date().toISOString(),
      engineVersion: PRICING_ENGINE_VERSION,
    };
  }
}
