import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { getTenantOffers } from "@/modules/commercial";
import {
  createWeeklyMenuRepository,
  type WeeklyMenuSlotWithDish,
} from "../infrastructure/weekly-menu-repository";

/** v1 writers cannot turn an offer into catalogue pricing or select an arbitrary slot. */
export function assertLegacyOfferSlots(
  tenantId: string,
  menuId: string,
  lines: Array<{ dishId: string; dayDate: string }>,
  slots: WeeklyMenuSlotWithDish[],
  commercialActive: boolean,
): void {
  for (const line of lines) {
    const eligible = slots.filter(
      (slot) =>
        slot.tenant_id === tenantId &&
        slot.weekly_menu_id === menuId &&
        slot.day_date === line.dayDate &&
        slot.dish_id === line.dishId &&
        slot.dishes?.id === line.dishId &&
        slot.dishes.tenant_id === tenantId &&
        slot.dishes.status === "active" &&
        !slot.dishes.deleted_at,
    );
    if (!eligible.length)
      throw new DomainError("OFFER_NOT_FOUND", "No eligible published offer for this line");
    if (eligible.length !== 1)
      throw new DomainError("OFFER_AMBIGUOUS", "Legacy selection needs exactly one eligible slot");
    if (eligible[0]!.unit_price != null)
      throw new DomainError(
        commercialActive ? "OFFER_PRICING_COMMERCIAL_UNSUPPORTED" : "OFFER_PRICING_QUOTE_REQUIRED",
        "Explicit offer prices require the canonical quoted writer",
      );
  }
}

export async function assertLegacyOfferWrite(
  ctx: ServiceContext,
  weekStart: string,
  lines: Array<{ dishId: string; dayDate: string }>,
): Promise<void> {
  const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
  const menu = await repo.findPublishedByWeekStart(weekStart);
  if (!menu) throw new DomainError("OFFER_NOT_FOUND", "No eligible published menu");
  const slots = await repo.listSlotsWithDishes(menu.id);
  assertLegacyOfferSlots(
    ctx.tenantId,
    menu.id,
    lines,
    slots,
    getTenantOffers(ctx.tenantSlug).length > 0,
  );
}
