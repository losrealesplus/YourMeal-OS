/**
 * EP-002A.3 — CustomerPreferencesService
 * Explicit favorites + frequency suggestions against the published menu.
 */
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import { createOrderRepository } from "@/modules/orders/infrastructure/order-repository";
import { createWeeklyMenuRepository } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { fetchCatalogDishesByIds } from "@/modules/dish-library/application/dish-catalog-queries";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import {
  actionsForPreference,
  availableDayForDish,
  selectSuggestedDishes,
  type DishFrequency,
  type PreferenceAction,
  type PreferenceSource,
} from "../domain/customer-preferences";

export type PreferenceDishView = {
  dishId: string;
  source: PreferenceSource;
  orderCount: number | null;
  availableThisWeek: boolean;
  availableDayDate: string | null;
  actions: PreferenceAction[];
  dish: CatalogDish | null;
};

export type CustomerPreferencesSnapshot = {
  weekStart: string;
  favorites: PreferenceDishView[];
  suggestions: PreferenceDishView[];
};

async function resolveCustomerId(ctx: ServiceContext): Promise<string> {
  const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
  let customerId = await repo.findCustomerIdForUser(ctx.userId);
  if (!customerId) {
    const { CompanyAccountService } = await import(
      "@/modules/company-account/application/company-account-service"
    );
    customerId = await CompanyAccountService.ensureIndividualCustomer(ctx);
  }
  return customerId;
}

async function loadOfferByDish(
  ctx: ServiceContext,
  weekStart: string,
): Promise<Map<string, string[]>> {
  const menuRepo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
  const menu = await menuRepo.findPublishedByWeekStart(weekStart);
  const map = new Map<string, string[]>();
  if (!menu) return map;

  const slots = await menuRepo.listSlotsWithDishes(menu.id);
  for (const slot of slots) {
    if (!slot.dishes || slot.dishes.deleted_at) continue;
    const days = map.get(slot.dish_id) ?? [];
    if (!days.includes(slot.day_date)) days.push(slot.day_date);
    map.set(slot.dish_id, days);
  }
  return map;
}

async function listExplicitFavoriteIds(
  ctx: ServiceContext,
  customerId: string,
): Promise<string[]> {
  const db = ctx.supabase as any;
  const { data, error } = await db
    .from("customer_dish_favorites")
    .select("dish_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Array<{ dish_id: string }>).map((r) => r.dish_id);
}

async function loadFrequencies(
  ctx: ServiceContext,
  customerId: string,
): Promise<DishFrequency[]> {
  const db = ctx.supabase as any;
  const { data, error } = await db
    .from("orders")
    .select("id, status, order_items(dish_id, qty)")
    .eq("tenant_id", ctx.tenantId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .neq("status", "cancelled");
  if (error) throw error;

  const acc = new Map<string, { orderIds: Set<string>; totalQty: number }>();
  for (const order of (data ?? []) as Array<{
    id: string;
    order_items?: Array<{ dish_id: string; qty: number }> | null;
  }>) {
    for (const item of order.order_items ?? []) {
      if (!item.dish_id) continue;
      const row = acc.get(item.dish_id) ?? {
        orderIds: new Set<string>(),
        totalQty: 0,
      };
      row.orderIds.add(order.id);
      row.totalQty += Number(item.qty) || 1;
      acc.set(item.dish_id, row);
    }
  }

  return [...acc.entries()].map(([dishId, row]) => ({
    dishId,
    orderCount: row.orderIds.size,
    totalQty: row.totalQty,
  }));
}

function toView(
  dishId: string,
  source: PreferenceSource,
  orderCount: number | null,
  offerByDish: Map<string, string[]>,
  dishesById: Map<string, CatalogDish>,
): PreferenceDishView {
  const day = availableDayForDish(dishId, offerByDish);
  const availableThisWeek = Boolean(day);
  return {
    dishId,
    source,
    orderCount,
    availableThisWeek,
    availableDayDate: day,
    actions: actionsForPreference({ source, availableThisWeek }),
    dish: dishesById.get(dishId) ?? null,
  };
}

export const CustomerPreferencesService = {
  async getSnapshot(
    ctx: ServiceContext,
    weekStart: string = utcWeekStartMonday(),
  ): Promise<CustomerPreferencesSnapshot> {
    requireCapability(ctx.roles, "menus.read");
    const customerId = await resolveCustomerId(ctx);

    const [favoriteIds, frequencies, offerByDish] = await Promise.all([
      listExplicitFavoriteIds(ctx, customerId),
      loadFrequencies(ctx, customerId),
      loadOfferByDish(ctx, weekStart),
    ]);

    const favorited = new Set(favoriteIds);
    const suggested = selectSuggestedDishes({
      frequencies,
      favoritedDishIds: favorited,
    });

    const freqByDish = new Map(frequencies.map((f) => [f.dishId, f]));
    const allIds = [
      ...new Set([...favoriteIds, ...suggested.map((s) => s.dishId)]),
    ];
    const dishesById = await fetchCatalogDishesByIds(ctx.tenantId, allIds);

    const favorites = favoriteIds
      .map((id) =>
        toView(
          id,
          "explicit",
          freqByDish.get(id)?.orderCount ?? null,
          offerByDish,
          dishesById,
        ),
      )
      .filter((v) => v.dish);

    const suggestions = suggested
      .map((s) =>
        toView(s.dishId, "suggested", s.orderCount, offerByDish, dishesById),
      )
      .filter((v) => v.dish);

    return { weekStart, favorites, suggestions };
  },

  async isFavorite(
    ctx: ServiceContext,
    dishId: string,
  ): Promise<boolean> {
    requireCapability(ctx.roles, "menus.read");
    const customerId = await resolveCustomerId(ctx);
    const ids = await listExplicitFavoriteIds(ctx, customerId);
    return ids.includes(dishId);
  },

  async addFavorite(ctx: ServiceContext, dishId: string): Promise<void> {
    requireCapability(ctx.roles, "orders.write");
    if (!dishId) {
      throw new DomainError("INVALID_STATE", "dishId is required");
    }
    const customerId = await resolveCustomerId(ctx);
    const db = ctx.supabase as any;

    const { data: existing, error: findErr } = await db
      .from("customer_dish_favorites")
      .select("id, deleted_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("customer_id", customerId)
      .eq("dish_id", dishId)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing && !existing.deleted_at) return;

    if (existing?.deleted_at) {
      const { error } = await db
        .from("customer_dish_favorites")
        .update({ deleted_at: null })
        .eq("id", existing.id)
        .eq("tenant_id", ctx.tenantId);
      if (error) throw error;
    } else {
      const { error } = await db.from("customer_dish_favorites").insert({
        tenant_id: ctx.tenantId,
        customer_id: customerId,
        dish_id: dishId,
      });
      if (error) throw error;
    }

    await AuditService.write(ctx, {
      entityType: "customer_dish_favorite",
      entityId: dishId,
      action: "create",
      newData: { customerId, dishId },
    });
  },

  async removeFavorite(ctx: ServiceContext, dishId: string): Promise<void> {
    requireCapability(ctx.roles, "orders.write");
    if (!dishId) {
      throw new DomainError("INVALID_STATE", "dishId is required");
    }
    const customerId = await resolveCustomerId(ctx);
    const db = ctx.supabase as any;
    const { error } = await db
      .from("customer_dish_favorites")
      .update({ deleted_at: new Date().toISOString() })
      .eq("tenant_id", ctx.tenantId)
      .eq("customer_id", customerId)
      .eq("dish_id", dishId)
      .is("deleted_at", null);
    if (error) throw error;

    await AuditService.write(ctx, {
      entityType: "customer_dish_favorite",
      entityId: dishId,
      action: "archive",
      newData: { customerId, dishId },
    });
  },
};
