/**
 * MENU EXPERIENCE 001 · Zero Friction Weekly Menu Planning
 *
 * Weekly cycle — not CRUD.
 * Experience working set in session; OP-001 WeeklyMenuService for seed/publish when durable.
 * No Menu Capability / Facade / Engine changes.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishService } from "@/services/dish-service";
import { WeeklyMenuService } from "@/modules/weekly-menu/application/weekly-menu-service";
import {
  MenuPlanningPanel,
  type DishPick,
  type DurableMenuSeed,
} from "@/menu-experience/MenuPlanningPanel";
import { activeSlots, type WeekPlan } from "@/menu-experience/week-plan";

export const Route = createFileRoute("/_authenticated/admin/menu-planning")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "menus.read");
  },
  component: MenuPlanningExperiencePage,
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Menu Experience · Weekly Planning",
      },
      {
        name: "description",
        content:
          "MENU EXPERIENCE 001 · Zero Friction Weekly Menu Planning · Duplicate → adapt → publish",
      },
    ],
  }),
});

function MenuPlanningExperiencePage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const canWrite = can("menus.write");
  const [durableMenus, setDurableMenus] = useState<DurableMenuSeed[]>([]);
  const [dishPicks, setDishPicks] = useState<DishPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !tenantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const [menus, dishes] = await Promise.all([
          WeeklyMenuService.list(ctx),
          DishService.list(ctx),
        ]);
        if (cancelled) return;

        const picks: DishPick[] = dishes.map((d) => ({
          id: d.id,
          label: d.name,
          durable: true,
          macrosHint: null,
          allergenHint: null,
        }));
        setDishPicks(picks);

        const seeds: DurableMenuSeed[] = [];
        for (const menu of menus.slice(0, 8)) {
          const slots = await WeeklyMenuService.listSlots(ctx, menu.id);
          if (cancelled) return;
          seeds.push({
            id: menu.id,
            weekStart: menu.week_start,
            status: menu.status,
            slots: slots.map((s) => ({
              dayDate: s.day_date,
              dishId: s.dish_id,
              dishLabel: s.dishes?.name ?? "Plato",
              macrosHint: null,
              allergenHint: null,
            })),
          });
        }
        setDurableMenus(seeds);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles]);

  async function publishDurable(plan: WeekPlan) {
    if (!user || !tenantId) {
      return { ok: false, message: "Sin sesión" };
    }
    const slots = activeSlots(plan);
    if (slots.some((s) => s.dishId.startsWith("exp:"))) {
      return {
        ok: false,
        message: "Hay platos de conversación — publicación solo en sesión",
      };
    }
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const draft = await WeeklyMenuService.ensureDraft(ctx, plan.weekStart);
      const existing = await WeeklyMenuService.listSlots(ctx, draft.id);
      const existingKeys = new Set(
        existing.map((s) => `${s.day_date}:${s.dish_id}`),
      );
      for (const slot of slots) {
        const key = `${slot.dayDate}:${slot.dishId}`;
        if (existingKeys.has(key)) continue;
        await WeeklyMenuService.addDishToDay(ctx, {
          weeklyMenuId: draft.id,
          dayDate: slot.dayDate,
          dishId: slot.dishId,
        });
      }
      const published = await WeeklyMenuService.publish(ctx, draft.id);
      return { ok: true, menuId: published.id };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline="MENU EXPERIENCE 001 · Phase 001 Weekly Planning"
        title="Zero Friction Weekly Menu Planning"
        subtitle="Duplica la semana anterior · adapta los cambios · publica · sigue"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip tone="warning" label="TTWM < 10 min" />
        <StatusChip tone="info" label="Reuse before creation" />
        <Link
          to="/admin/menus"
          className="text-xs underline-offset-2 hover:underline"
        >
          Menús bootstrap
        </Link>
        <Link
          to="/admin/order-capture"
          search={{
            mode: "search",
            customerId: undefined,
            kind: undefined,
          }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Order Experience
        </Link>
        <Link
          to="/admin/dishes"
          className="text-xs underline-offset-2 hover:underline"
        >
          Biblioteca de platos
        </Link>
      </div>

      <AdminHeader
        goal="Preparar el menú semanal en <10 min sin empezar desde cero"
        capability="menus.read / menus.write"
        object="Weekly plan · duplicate · preview · publish · session honesty"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando semanas…</p>
      ) : (
        <MenuPlanningPanel
          canWrite={canWrite}
          durableMenus={durableMenus}
          dishPicks={dishPicks}
          onPublishDurable={publishDurable}
        />
      )}
    </div>
  );
}
