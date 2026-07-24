/**
 * ADMIN · Menús semanales — draft / slots / publish via WeeklyMenuService (OP-001).
 * Capability: menus.read / menus.write
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
import {
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

  async function reload() {
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
        menuRows.find((m) => m.week_start === utcWeekStartMonday()) ??
        menuRows[0] ??
        null;
      setActive(current);
      if (current) {
        setSlots(await WeeklyMenuService.listSlots(serviceCtx, current.id));
        const dates = utcWeekDates(current.week_start);
        setDayDate((d) => d || dates[0]);
      } else {
        setSlots([]);
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
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function selectMenu(menu: WeeklyMenuRow) {
    setActive(menu);
    try {
      const serviceCtx = await ctx();
      setSlots(await WeeklyMenuService.listSlots(serviceCtx, menu.id));
      setDayDate(utcWeekDates(menu.week_start)[0]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function addSlot() {
    if (!active || !dishId || !dayDate) return;
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
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const weekDays = active ? utcWeekDates(active.week_start) : [];

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
        {active && can("menus.write") && active.status !== "published" ? (
          <Button
            type="button"
            variant="default"
            onClick={publish}
            disabled={busy || slots.length === 0}
          >
            Publicar menú
          </Button>
        ) : null}
      </div>

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
                          value={dayDate}
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
                    {slots.map((s) => (
                      <li
                        key={s.id}
                        className="py-2 flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground tabular-nums">
                          {s.day_date}
                        </span>
                        <span className="font-medium">
                          {s.dishes?.name ?? "—"}
                        </span>
                      </li>
                    ))}
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
