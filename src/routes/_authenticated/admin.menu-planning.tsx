/**
 * MENU EXPERIENCE 001 · MENU EXPERIENCE 002 · MENU EXPERIENCE 003 · MENU EXPERIENCE 004 · MENU EXPERIENCE 005
 * Planning · Search · Adaptation · Dish Library · Publish & Preview
 *
 * Temporal hierarchy: Week → Day → Menu → Dishes.
 * Dish Library = operational memory consumed by planning (not dish CRUD).
 * Publish closes the weekly cycle — ready for Orders and Production.
 * Experience working set in session; OP-001 WeeklyMenuService for seed/publish when durable.
 * No Menu / Dish Capability / Facade / Engine changes.
 */

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
import { MenuAdaptationPanel } from "@/menu-experience/MenuAdaptationPanel";
import { dishRowToLibraryItem, type DishLibraryItem } from "@/menu-experience/dish-library";
import {
  activeSlots,
  createEmptyWeek,
  duplicateWeekPlan,
  getWeekPlan,
  listWeekPlans,
  markPublished,
  mondayIso,
  nextWeekStart,
  prevWeekStart,
  saveWeekPlan,
  type WeekPlan,
} from "@/menu-experience/week-plan";

type ExperienceMode = "search" | "planning" | "adapt" | "publish";

export const Route = createFileRoute("/_authenticated/admin/menu-planning")({
  beforeLoad: ({ context, search }) => {
    assertCapabilityFromContext(context, "menus.read");
    throw redirect({
      to: "/admin/menus",
      search:
        typeof search === "object" &&
        search !== null &&
        "weekStart" in search &&
        typeof search.weekStart === "string"
          ? { weekStart: search.weekStart }
          : undefined,
    });
  },
  component: MenuPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search.mode === "planning" ||
      search.mode === "search" ||
      search.mode === "adapt" ||
      search.mode === "publish"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
    weekStart: typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Menu Experience · Publish · Adaptation · Planning",
      },
      {
        name: "description",
        content:
          "MENU EXPERIENCE 005 Publish & Preview · 004 Dish Library · 003 Adaptation · 002 Search · 001 Planning",
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

  const [mode, setMode] = useState<ExperienceMode>(() => {
    if (
      searchParams.mode === "planning" ||
      searchParams.mode === "adapt" ||
      searchParams.mode === "publish"
    ) {
      return searchParams.mode;
    }
    return "search";
  });
  const [focusWeekStart, setFocusWeekStart] = useState<string | null>(
    searchParams.weekStart ?? mondayIso(),
  );
  const [startInPreview, setStartInPreview] = useState(() => searchParams.mode === "publish");
  const [focusNonce, setFocusNonce] = useState(0);
  const [durableMenus, setDurableMenus] = useState<DurableMenuSeed[]>([]);
  const [dishPicks, setDishPicks] = useState<DishPick[]>([]);
  const [libraryItems, setLibraryItems] = useState<DishLibraryItem[]>([]);
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

        const library = dishes.map(dishRowToLibraryItem);
        setLibraryItems(library);
        const picks: DishPick[] = library.map((d) => ({
          id: d.id,
          label: d.label,
          durable: d.durable,
          macrosHint: d.macrosHint,
          allergenHint: d.allergenHint,
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
    goMode(preview ? "publish" : "planning", weekStart);
  }

  function openPublish(weekStart: string) {
    if (!getWeekPlan(weekStart)) {
      const seed = durableMenus.find((m) => m.weekStart === weekStart);
      if (seed) {
        saveWeekPlan({ ...seedToPlan(seed), status: "draft" });
      } else {
        createEmptyWeek(weekStart);
      }
    }
    setFocusWeekStart(weekStart);
    setStartInPreview(true);
    setFocusNonce((n) => n + 1);
    goMode("publish", weekStart);
  }

  function openAdapt(weekStart: string) {
    setFocusWeekStart(weekStart);
    setStartInPreview(false);
    setFocusNonce((n) => n + 1);
    goMode("adapt", weekStart);
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
    const source = resolveSource(fromWeek) ?? resolveSource(prevWeekStart(mondayIso()));
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
    toast.success("Semana duplicada — adapta solo los cambios");
    openAdapt(target);
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
      return { ok: false as const, message: "Sin sesión" };
    }
    const slots = activeSlots(plan);
    if (slots.some((s) => s.dishId.startsWith("exp:"))) {
      return {
        ok: false as const,
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
      const existingKeys = new Set(existing.map((s) => `${s.day_date}:${s.dish_id}`));
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
      return { ok: true as const, menuId: published.id };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async function publishAdaptation(plan: WeekPlan) {
    const result = await publishDurable(plan);
    if (result.ok) {
      markPublished(plan.weekStart, "published_durable", result.menuId);
      toast.success("Adaptación publicada");
      return;
    }
    markPublished(plan.weekStart, "published_session");
    toast.success(result.message ?? "Adaptación lista (sesión)");
  }

  const week = focusWeekStart ?? mondayIso();

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "publish"
            ? "MENU EXPERIENCE 005 · Publish & Preview"
            : mode === "adapt"
              ? "MENU EXPERIENCE 004 · Dish Library · 003 Weekly Adaptation"
              : mode === "search"
                ? "MENU EXPERIENCE 002 · Phase 002 Search"
                : "MENU EXPERIENCE 005 · Publish · 001 Weekly Planning"
        }
        title={
          mode === "publish"
            ? "Zero Friction Publish & Preview"
            : mode === "adapt"
              ? "Zero Friction Weekly Adaptation"
              : mode === "search"
                ? "Zero Friction Menu Search"
                : "Zero Friction Weekly Menu Planning"
        }
        subtitle={
          mode === "publish"
            ? "Revisa la semana · valida · publica con confianza"
            : mode === "adapt"
              ? "Reutiliza la Dish Library · adapta sin reconstruir"
              : mode === "search"
                ? "Encuentra cualquier elemento de la planificación en segundos"
                : "Duplica · inserta desde la biblioteca · revisa · publica"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "publish" ? (
          <StatusChip tone="warning" label="TTRP < 5 min" />
        ) : mode === "adapt" ? (
          <StatusChip tone="warning" label="TTFID < 15 s" />
        ) : mode === "search" ? (
          <StatusChip tone="warning" label="TTFM < 10 s" />
        ) : (
          <StatusChip tone="warning" label="TTWM < 10 min" />
        )}
        <StatusChip tone="info" label="Semana → Día → Menú → Platos" />
        <StatusChip tone="info" label="Listo para Orders · Production" />
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
          onClick={() => {
            setStartInPreview(false);
            goMode("planning", week);
          }}
        >
          Planificación
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("adapt", week)}
        >
          Adaptación
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => openPublish(week)}
        >
          Publicar
        </button>
        <Link
          to="/admin/menus"
          search={{ weekStart: undefined }}
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
          mode === "publish"
            ? "Revisar y publicar la semana operativa en <5 min"
            : mode === "adapt"
              ? "Encontrar e insertar/reemplazar un plato desde la biblioteca en <15s"
              : mode === "search"
                ? "Encontrar cualquier elemento de planificación en <10s"
                : "Preparar la semana · revisar · publicar · TTRP <5 min"
        }
        capability="menus.read / menus.write · dishes.read"
        object="Publish & Preview · Dish Library · weekly cycle · session honesty"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando semanas…</p>
      ) : mode === "search" ? (
        <MenuSearchPanel
          durableMenus={durableMenus}
          canWrite={canWrite}
          onOpenWeek={(weekStart) => openWeek(weekStart, false)}
          onAdaptWeek={openAdapt}
          onDuplicateWeek={duplicateWeek}
          onPreviewWeek={(weekStart) => openPublish(weekStart)}
          onCreateWeek={createWeek}
        />
      ) : mode === "adapt" ? (
        <MenuAdaptationPanel
          key={`adapt-${week}-${focusNonce}`}
          canWrite={canWrite}
          weekStart={week}
          durableMenus={durableMenus}
          dishPicks={dishPicks}
          libraryItems={libraryItems}
          onPreview={() => openPublish(week)}
          onPublish={publishAdaptation}
          onBackToSearch={() => goMode("search")}
        />
      ) : (
        <MenuPlanningPanel
          key={`${week}-${focusNonce}-${mode}`}
          canWrite={canWrite}
          durableMenus={durableMenus}
          dishPicks={dishPicks}
          libraryItems={libraryItems}
          focusWeekStart={focusWeekStart}
          startInPreview={mode === "publish" || startInPreview}
          onPublishDurable={publishDurable}
        />
      )}
    </div>
  );
}
