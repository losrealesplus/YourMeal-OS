/**
 * YOURMEAL OS — UNIVERSAL COMMERCIAL PRICING & PROMOTIONS DOMAIN TYPES
 *
 * Core architectural invariant:
 * DISH ≠ WEEKLY MENU ≠ COMMERCIAL OFFER ≠ PRICE BOOK ≠ PROMOTION ≠ PRICE SNAPSHOT
 *
 * 0 × Client-side math. All prices, savings and breakdowns are evaluated by the engine
 * in integer cents to ensure determinism across UI, checkout, orders and audit logs.
 */

export type CurrencyCode = string; // ISO 4217 standard (e.g., "EUR", "USD", "GBP", "MXN")

export interface Money {
  cents: number;
  currency: CurrencyCode;
  formatted: string; // e.g. "11,90 €"
}

export type PromotionType =
  | "percentage"    // e.g. 10.0 -> 10% discount
  | "fixed_amount"  // e.g. 200 -> 2,00 € discount
  | "fixed_price";  // e.g. 997 -> target price 9,97 €

export type PromotionScope =
  | "offer_base"
  | "menu_dish"
  | "extras"
  | "shipping";

export type CustomerTier =
  | "public"
  | "subscriber_weekly"
  | "subscriber_monthly"
  | "corporate"
  | "employee";

export interface PromotionRule {
  id: string;
  code: string;
  name: string;
  type: PromotionType;
  /**
   * Numeric rule value:
   * - percentage: e.g. 10.0 (10%)
   * - fixed_amount: discount in integer cents (e.g. 200 = 2,00 €)
   * - fixed_price: target final price in integer cents (e.g. 997 = 9,97 €)
   */
  value: number;
  appliesTo: PromotionScope;
  eligibility: CustomerTier | CustomerTier[];
  priority?: number; // Higher number = evaluated first (default 0)
  stackable?: boolean; // Whether it can combine with other promotions in the same scope (default false)
  badgeLabel?: string; // Optional custom display text, e.g. "🟢 Ahorras 1,93 € (16%)"
}

export interface CommercialOffer {
  id: string;
  code: string; // e.g. "individual_menu", "weekly_plan", "monthly_plan"
  title: string;
  subtitle: string;
  description: string;
  basePrice: Money;
  unitLabel: string; // e.g. "menú", "semana", "ración"
  slotsIncluded: number; // e.g. 1 for individual, 5 for weekly, 20 for monthly
  promotions: PromotionRule[];
  benefits?: string[];
  recommended?: boolean;
}

export interface ExtraItemInput {
  dishId: string;
  dishName: string;
  basePriceCents: number;
  qty?: number;
}

export interface ExtraItemEvaluationResult {
  dishId: string;
  dishName: string;
  qty: number;
  baseUnitPrice: Money;
  finalUnitPrice: Money;
  totalBasePrice: Money;
  totalFinalPrice: Money;
  totalSavings: Money;
  savingsPercentage: number;
  appliedPromotion: PromotionRule | null;
}

export interface PriceEvaluationContext {
  offerCode: string;
  customerTier: CustomerTier;
  itemCount?: number;
  extras?: ExtraItemInput[];
}

export interface AppliedPromotionDetail {
  ruleId: string;
  code: string;
  name: string;
  type: PromotionType;
  value: number;
  appliesTo: PromotionScope;
  discountCents: number;
  formattedDiscount: string;
}

export interface PricingEvaluationResult {
  offerCode: string;
  customerTier: CustomerTier;
  basePrice: Money;
  finalPrice: Money;
  totalSavings: Money;
  savingsPercentage: number;
  hasDiscount: boolean;
  appliedPromotions: AppliedPromotionDetail[];
  pricingBadge: string | null;
  extrasBreakdown: ExtraItemEvaluationResult[];
  extrasTotalBasePrice: Money;
  extrasTotalFinalPrice: Money;
  extrasTotalSavings: Money;
  grandTotalBasePrice: Money;
  grandTotalFinalPrice: Money;
  grandTotalSavings: Money;
}

export interface OrderItemPriceDetail {
  slotId?: string;
  dishId: string;
  dishName: string;
  itemType: "menu_dish" | "extra";
  qty: number;
  basePriceCents: number;
  finalPriceCents: number;
  discountCents: number;
}

export interface CreatePriceSnapshotOptions {
  orderId?: string;
  lineItems?: OrderItemPriceDetail[];
}

export interface OrderPriceSnapshot {
  orderId?: string;
  offerCode: string;
  customerTier: CustomerTier;
  baseAmountCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
  currency: CurrencyCode;
  appliedPromotions: Array<{
    ruleId: string;
    code: string;
    name: string;
    discountCents: number;
    formattedDiscount: string;
  }>;
  items: OrderItemPriceDetail[];
  evaluatedAt: string;
  engineVersion: string;
}
