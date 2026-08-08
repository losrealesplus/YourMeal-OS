/**
 * MENU EXPERIENCE · Weekly Planning · Search (001–002)
 *
 * Temporal hierarchy: Week → Day → Menu → Dishes.
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
import { MenuSearchPanel } from "@/menu-experience/MenuSearchPanel";
import {
  activeSlots,
  createEmptyWeek,
  duplicateWeekPlan,
  getWeekPlan,
  listWeekPlans,
  mondayIso,
  nextWeekStart,
  prevWeekStart,
  type WeekPlan,
} from "@/menu-experience/week-plan";

type ExperienceMode = "search" | "planning";

export const Route = createFileRoute("/_authenticated/admin/menu-planning")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "menus.read");
  },
  component: MenuPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search.mode === "planning" || search.mode === "search"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Menu Experience · Search · Weekly Planning",
      },
      {
        name: "description",
        content:
          "MENU EXPERIENCE 002 Search · 001 Weekly Planning · Week → Day → Menu → Dishes",
      },
    ],
  }),
});

function seedToPlan(seed: DurableMenuSeed): WeekPlan {
  const now = new Date().toISOString();
  return {
    id: `seed_${seed.id}`,
    weekStart: seed.weekStart,
    status: seed.status === "published" ? "published_durable" : "draft",
    sourceMenuId: seed.id,
    durableMenuId: seed.id,
    slots: seed.slots.map((s, i) => ({
      id: `seed_slot_${seed.id}_${i}`,
      dayDate: s.dayDate,
      dishId: s.dishId,
      dishLabel: s.dishLabel,
      disabled: false,
      macrosHint: s.macrosHint ?? null,
      allergenHint: s.allergenHint ?? null,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function MenuPlanningExperiencePage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const canWrite = can("menus.write");
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const [mode, setMode] = useState<ExperienceMode>(
    searchParams.mode === "planning" ? "planning" : "search",
  );
  const [focusWeekStart, setFocusWeekStart] = useState<string | null>(
    searchParams.weekStart ?? null,
  );
  const [startInPreview, setStartInPreview] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
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

  function goMode(next: ExperienceMode, weekStart?: string) {
    setMode(next);
    if (weekStart) setFocusWeekStart(weekStart);
    void navigate({
      to: "/admin/menu-planning",
      search: {
        mode: next,
        weekStart: weekStart ?? focusWeekStart ?? undefined,
      },
    });
  }

  function openWeek(weekStart: string, preview = false) {
    setFocusWeekStart(weekStart);
    setStartInPreview(preview);
    setFocusNonce((n) => n + 1);
    goMode("planning", weekStart);
  }

  function resolveSource(weekStart: string): WeekPlan | null {
    const session = getWeekPlan(weekStart);
    if (session) return session;
    const durable = durableMenus.find((m) => m.weekStart === weekStart);
    if (durable) return seedToPlan(durable);
    const prev = listWeekPlans().find((p) => p.weekStart < weekStart);
    if (prev) return prev;
    const durablePrev = [...durableMenus]
      .filter((m) => m.weekStart < weekStart)
      .sort((a, b) => Date.parse(b.weekStart) - Date.parse(a.weekStart))[0];
    return durablePrev ? seedToPlan(durablePrev) : null;
  }

  function duplicateWeek(fromWeek: string) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const source =
      resolveSource(fromWeek) ?? resolveSource(prevWeekStart(mondayIso()));
    const target = nextWeekStart(source?.weekStart ?? mondayIso());
    if (!source) {
      createEmptyWeek(target);
      toast.message("Sin semana fuente — creada vacía");
      openWeek(target);
      return;
    }
    duplicateWeekPlan({
      source,
      targetWeekStart: target,
      sourceMenuId: source.durableMenuId ?? source.sourceMenuId,
    });
    toast.success("Semana duplicada — edita solo los cambios");
    openWeek(target);
  }

  function createWeek() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const week = mondayIso();
    if (!getWeekPlan(week)) createEmptyWeek(week);
    openWeek(week);
  }

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
        overline={
          mode === "search"
            ? "MENU EXPERIENCE 002 · Phase 002 Search"
            : "MENU EXPERIENCE 001 · Phase 001 Weekly Planning"
        }
        title={
          mode === "search"
            ? "Zero Friction Menu Search"
            : "Zero Friction Weekly Menu Planning"
        }
        subtitle={
          mode === "search"
            ? "Encuentra cualquier elemento de la planificación en segundos"
            : "Duplica la semana anterior · adapta los cambios · publica · sigue"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "search" ? (
          <StatusChip tone="warning" label="TTFM < 10 s" />
        ) : (
          <StatusChip tone="warning" label="TTWM < 10 min" />
        )}
        <StatusChip tone="info" label="Semana → Día → Menú → Platos" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("search")}
        >
          Búsqueda
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("planning", focusWeekStart ?? mondayIso())}
        >
          Planificación
        </button>
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
      </div>

      <AdminHeader
        goal={
          mode === "search"
            ? "Encontrar cualquier elemento de planificación en <10s"
            : "Preparar el menú semanal en <10 min sin empezar desde cero"
        }
        capability="menus.read / menus.write"
        object="Weekly timeline · search · duplicate · preview · session honesty"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando semanas…</p>
      ) : mode === "search" ? (
        <MenuSearchPanel
          durableMenus={durableMenus}
          canWrite={canWrite}
          onOpenWeek={(weekStart) => openWeek(weekStart, false)}
          onDuplicateWeek={duplicateWeek}
          onPreviewWeek={(weekStart) => openWeek(weekStart, true)}
          onCreateWeek={createWeek}
        />
      ) : (
        <MenuPlanningPanel
          key={`${focusWeekStart ?? "current"}-${focusNonce}`}
          canWrite={canWrite}
          durableMenus={durableMenus}
          dishPicks={dishPicks}
          focusWeekStart={focusWeekStart}
          startInPreview={startInPreview}
          onPublishDurable={publishDurable}
        />
      )}
    </div>
  );
}
