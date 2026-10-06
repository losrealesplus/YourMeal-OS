import { isDayDateInWeek, isValidMondayIso } from "../application/week-dates";

export class OfferQuoteError extends Error {
  constructor(
    public readonly code:
      | "PRICE_UNAVAILABLE"
      | "OFFER_NOT_FOUND"
      | "OFFER_AMBIGUOUS"
      | "OFFER_REFERENCE_INVALID"
      | "OFFER_PRICING_COMMERCIAL_UNSUPPORTED"
      | "COMMERCIAL_QUOTE_REQUIRED"
      | "ZERO_PRICE_CONFIRMATION_REQUIRED"
      | "PRICE_CHANGED",
  ) {
    super(code);
    this.name = "OfferQuoteError";
  }
}

/** Monetary transport stays decimal text. No float arithmetic or raw numeric cast. */
export function offerPriceUnits(value: unknown): bigint {
  if (typeof value !== "string" && typeof value !== "number")
    throw new OfferQuoteError("PRICE_UNAVAILABLE");
  const text = String(value);
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/.test(text))
    throw new OfferQuoteError("PRICE_UNAVAILABLE");
  const [integer, fraction = ""] = text.split(".");
  return BigInt(integer!) * 10000n + BigInt(fraction.padEnd(4, "0"));
}

export function offerUnitsText(value: bigint): string {
  return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`;
}

export type OfferQuoteLine = { slotId?: string; dishId: string; dayDate: string; qty: number };
export type OfferQuoteCandidate = {
  slotId: string;
  menuId: string;
  tenantId: string;
  dishTenantId: string;
  menuTenantId: string;
  dishId: string;
  dayDate: string;
  weekStart: string | null;
  menuStatus: string;
  menuDeleted: boolean;
  dishStatus: string;
  dishDeleted: boolean;
  basePrice: unknown;
  slotPrice: unknown;
};
export type ResolvedOfferQuoteLine = {
  slotId: string;
  menuId: string;
  dishId: string;
  dayDate: string;
  qty: number;
  basePrice: string;
  slotPrice: string | null;
  unitPrice: string;
  priceSource: "slot" | "catalogue";
  priceSnapshotStatus: "captured" | "explicit_zero";
};

export type CommercialMode =
  | "commercial_inactive"
  | "individual_line_pricing_v1"
  | "weekly_plan"
  | "monthly_plan"
  | "package"
  | "corporate";

/** Called only with verified server commercial context; never accept that flag from input. */
export function resolveOfferQuote(input: {
  tenantId: string;
  weekStart: string;
  lines: OfferQuoteLine[];
  candidates: OfferQuoteCandidate[];
  commercialActive?: boolean;
  commercialMode?: CommercialMode;
  zeroConfirmed: boolean;
}): { lines: ResolvedOfferQuoteLine[]; total: string } {
  if (!isValidMondayIso(input.weekStart) || input.lines.length === 0)
    throw new OfferQuoteError("OFFER_REFERENCE_INVALID");

  const mode: CommercialMode =
    input.commercialMode ??
    (input.commercialActive ? "weekly_plan" : "commercial_inactive");

  const lines = input.lines.map((line): ResolvedOfferQuoteLine => {
    if (
      !Number.isInteger(line.qty) ||
      line.qty <= 0 ||
      line.qty > 2147483647 ||
      !isDayDateInWeek(input.weekStart, line.dayDate)
    )
      throw new OfferQuoteError("OFFER_REFERENCE_INVALID");
    const eligible = input.candidates.filter(
      (candidate) =>
        candidate.tenantId === input.tenantId &&
        candidate.menuTenantId === input.tenantId &&
        candidate.dishTenantId === input.tenantId &&
        candidate.menuStatus === "published" &&
        !candidate.menuDeleted &&
        candidate.dishStatus === "active" &&
        !candidate.dishDeleted &&
        candidate.weekStart === input.weekStart &&
        candidate.dayDate === line.dayDate &&
        candidate.dishId === line.dishId &&
        (line.slotId === undefined || line.slotId === candidate.slotId),
    );
    if (eligible.length === 0) throw new OfferQuoteError("OFFER_NOT_FOUND");
    if (eligible.length !== 1) throw new OfferQuoteError("OFFER_AMBIGUOUS");
    const offer = eligible[0]!;

    // In unsupported commercial modes (e.g. weekly_plan, monthly_plan, packages),
    // explicit slot pricing fails closed.
    if (mode !== "commercial_inactive" && mode !== "individual_line_pricing_v1") {
      if (offer.slotPrice != null) {
        throw new OfferQuoteError("OFFER_PRICING_COMMERCIAL_UNSUPPORTED");
      }
      throw new OfferQuoteError("COMMERCIAL_QUOTE_REQUIRED");
    }

    const base = offerPriceUnits(offer.basePrice);
    const slot = offer.slotPrice == null ? null : offerPriceUnits(offer.slotPrice);

    // In both commercial_inactive and individual_line_pricing_v1,
    // effective_line_price = slot.unit_price ?? dishes.price
    const effective = slot ?? base;
    if (effective === 0n && slot === null) throw new OfferQuoteError("PRICE_UNAVAILABLE");
    if (effective === 0n && !input.zeroConfirmed)
      throw new OfferQuoteError("ZERO_PRICE_CONFIRMATION_REQUIRED");
    return {
      slotId: offer.slotId,
      menuId: offer.menuId,
      dishId: offer.dishId,
      dayDate: offer.dayDate,
      qty: line.qty,
      basePrice: offerUnitsText(base),
      slotPrice: slot === null ? null : offerUnitsText(slot),
      unitPrice: offerUnitsText(effective),
      priceSource: slot === null ? "catalogue" : "slot",
      priceSnapshotStatus: effective === 0n ? "explicit_zero" : "captured",
    };
  });
  const totalUnits = lines.reduce(
    (total, line) => total + offerPriceUnits(line.unitPrice) * BigInt(line.qty),
    0n,
  );
  const cents = (totalUnits + 50n) / 100n;
  return { lines, total: `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}` };
}
