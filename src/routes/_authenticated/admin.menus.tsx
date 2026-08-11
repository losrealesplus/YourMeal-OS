/**
 * ADMIN · Menús semanales — draft / slots / publish via WeeklyMenuService (OP-001).
 * Capability: menus.read / menus.write
 *
 * Integrity: dayDate always ∈ active week; published menus can be opened
 * for edit (unpublish) to reassign out-of-week slots, then republish.
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishService } from "@/services/dish-service";
import { WeeklyMenuService } from "@/modules/weekly-menu/application/weekly-menu-service";
import { resolveDayDateForWeek } from "@/modules/weekly-menu/application/admin-menu-day-date";
import {
  isDayDateInWeek,
  utcWeekDates,
  utcWeekStartMonday,
} from "@/modules/weekly-menu/application/week-dates";
import type { WeeklyMenuRow } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import type { WeeklyMenuSlotWithDish } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import { AdminHeader, PanelCard, SectionTitle, StatusChip } from "@/components/admin";
import { BootstrapReadinessBanner } from "@/components/tenant/bootstrap-readiness-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/menus")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "menus.read");
  },
  component: AdminMenusPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Menús semanales" },
      {
        name: "description",
        content: "Planificación y publicación del menú semanal operativo.",
      },
    ],
  }),
});

function AdminMenusPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [menus, setMenus] = useState<WeeklyMenuRow[]>([]);
  const [active, setActive] = useState<WeeklyMenuRow | null>(null);
  const [slots, setSlots] = useState<WeeklyMenuSlotWithDish[]>([]);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [dayDate, setDayDate] = useState("");
  const [dishId, setDishId] = useState("");
  const [slotDayEdits, setSlotDayEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function ctx() {
    if (!user || !tenantId) throw new Error("Missing auth");
    return createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
  }

  async function loadActive(
    serviceCtx: Awaited<ReturnType<typeof ctx>>,
    menu: WeeklyMenuRow,
    preferDayDate?: string,
  ) {
    setActive(menu);
    setSlots(await WeeklyMenuService.listSlots(serviceCtx, menu.id));
    setDayDate(resolveDayDateForWeek(menu.week_start, preferDayDate));
    setSlotDayEdits({});
  }

  async function reload(preferMenuId?: string | null) {
    setLoading(true);
    try {
      const serviceCtx = await ctx();
      const [menuRows, dishRows] = await Promise.all([
        WeeklyMenuService.list(serviceCtx),
        DishService.list(serviceCtx),
      ]);
      setMenus(menuRows);
      setDishes(dishRows);
      const current =
        (preferMenuId
          ? menuRows.find((m) => m.id === preferMenuId)
          : undefined) ??
        menuRows.find((m) => m.week_start === utcWeekStartMonday()) ??
        menuRows[0] ??
        null;
      if (current) {
        await loadActive(serviceCtx, current);
      } else {
        setActive(null);
        setSlots([]);
        setDayDate("");
      }
      if (dishRows[0]) setDishId((id) => id || dishRows[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  async function ensureDraft() {
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      const draft = await WeeklyMenuService.ensureDraft(serviceCtx);
      toast.success(`Borrador listo · semana ${draft.week_start}`);
      await reload(draft.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function selectMenu(menu: WeeklyMenuRow) {
    try {
      const serviceCtx = await ctx();
      await loadActive(serviceCtx, menu);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function addSlot() {
    if (!active || !dishId || !dayDate) return;
    if (!isDayDateInWeek(active.week_start, dayDate)) {
      toast.error("El día seleccionado no pertenece a esta semana.");
      setDayDate(resolveDayDateForWeek(active.week_start, null));
      return;
    }
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      await WeeklyMenuService.addDishToDay(serviceCtx, {
        weeklyMenuId: active.id,
        dayDate,
        dishId,
      });
      toast.success("Plato añadido al día");
      setSlots(await WeeklyMenuService.listSlots(serviceCtx, active.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!active) return;
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      await WeeklyMenuService.publish(serviceCtx, active.id);
      toast.success("Menú publicado — ya puede recibir pedidos");
      await reload(active.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function openForEdit() {
    if (!active) return;
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      const draft = await WeeklyMenuService.unpublish(serviceCtx, active.id);
      toast.success("Menú abierto para editar (borrador)");
      await loadActive(serviceCtx, draft);
      setMenus((rows) =>
        rows.map((m) => (m.id === draft.id ? draft : m)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function reassignSlot(slotId: string) {
    if (!active) return;
    const nextDay =
      slotDayEdits[slotId] ?? resolveDayDateForWeek(active.week_start, null);
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      await WeeklyMenuService.reassignSlotDay(serviceCtx, {
        slotId,
        dayDate: nextDay,
      });
      toast.success("Día del plato corregido");
      setSlots(await WeeklyMenuService.listSlots(serviceCtx, active.id));
      setSlotDayEdits((prev) => {
        const copy = { ...prev };
        delete copy[slotId];
        return copy;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const weekDays = active ? utcWeekDates(active.week_start) : [];
  const selectDayValue = active
    ? resolveDayDateForWeek(active.week_start, dayDate)
    : "";
  const hasOutOfWeekSlots =
    !!active &&
    slots.some((s) => !isDayDateInWeek(active.week_start, s.day_date));

  return (
    <div className="animate-fade-in space-y-4">
      <SectionTitle
        overline="Operaciones"
        title="Menús semanales"
        subtitle="Crea el borrador de la semana, añade platos por día y publica para abrir pedidos."
      />
      <AdminHeader
        goal="Publicar oferta semanal"
        capability="menus.write"
        object="WeeklyMenu · MenuSlot"
      />

      <BootstrapReadinessBanner
        focus={["BOOTSTRAP_NO_DISHES", "BOOTSTRAP_EMPTY_MENU"]}
      />

      <div className="flex flex-wrap gap-2">
        {can("menus.write") ? (
          <Button type="button" onClick={ensureDraft} disabled={busy}>
            Borrador semana actual
          </Button>
        ) : null}
        {active && can("menus.write") && active.status === "published" ? (
          <Button
            type="button"
            variant="outline"
            onClick={openForEdit}
            disabled={busy}
          >
            Abrir para editar
          </Button>
        ) : null}
        {active && can("menus.write") && active.status !== "published" ? (
          <Button
            type="button"
            variant="default"
            onClick={publish}
            disabled={busy || slots.length === 0 || hasOutOfWeekSlots}
          >
            Publicar menú
          </Button>
        ) : null}
      </div>

      {hasOutOfWeekSlots && active?.status !== "published" ? (
        <p className="text-sm text-destructive px-1">
          Hay platos con día fuera de esta semana. Corrígelos antes de publicar.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Cargando…
        </p>
      ) : (
        <>
          <PanelCard>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Semanas
            </p>
            {menus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay menús. Crea el borrador de la semana actual.
              </p>
            ) : (
              <ul className="space-y-2">
                {menus.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => selectMenu(m)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm border ${
                        active?.id === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <span className="font-medium">Semana {m.week_start}</span>
                      <StatusChip
                        tone={m.status === "published" ? "positive" : "neutral"}
                        label={m.status}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          {active ? (
            <>
              {can("menus.write") && active.status !== "published" ? (
                <PanelCard>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Añadir plato
                  </p>
                  {dishes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay platos activos. Ve a Biblioteca de platos primero.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3 items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor="menu-day">Día</Label>
                        <select
                          id="menu-day"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={selectDayValue}
                          onChange={(e) => setDayDate(e.target.value)}
                        >
                          {weekDays.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="menu-dish">Plato</Label>
                        <select
                          id="menu-dish"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={dishId}
                          onChange={(e) => setDishId(e.target.value)}
                        >
                          {dishes.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button type="button" onClick={addSlot} disabled={busy}>
                        Añadir
                      </Button>
                    </div>
                  )}
                </PanelCard>
              ) : null}

              <PanelCard>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Slots · {active.week_start}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Menú vacío. Añade al menos un plato antes de publicar.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {slots.map((s) => {
                      const valid = isDayDateInWeek(
                        active.week_start,
                        s.day_date,
                      );
                      const editValue =
                        slotDayEdits[s.id] ??
                        (valid
                          ? s.day_date
                          : resolveDayDateForWeek(active.week_start, null));
                      return (
                        <li
                          key={s.id}
                          className={cn(
                            "py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm",
                            !valid && "bg-destructive/5 -mx-2 px-2 rounded-md",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3 flex-1">
                            <span
                              className={cn(
                                "tabular-nums",
                                valid
                                  ? "text-muted-foreground"
                                  : "text-destructive font-medium",
                              )}
                            >
                              {s.day_date}
                              {!valid ? " · fuera de semana" : ""}
                            </span>
                            <span className="font-medium">
                              {s.dishes?.name ?? "—"}
                            </span>
                          </div>
                          {can("menus.write") &&
                          active.status !== "published" &&
                          !valid ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                value={editValue}
                                onChange={(e) =>
                                  setSlotDayEdits((prev) => ({
                                    ...prev,
                                    [s.id]: e.target.value,
                                  }))
                                }
                              >
                                {weekDays.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => reassignSlot(s.id)}
                              >
                                Corregir día
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelCard>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
