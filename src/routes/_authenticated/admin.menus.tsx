/**
 * YOURMEAL OS — A3 CANONICAL WEEKLY MENU WORKSPACE
 * Route: /admin/menus
 *
 * Capabilities: menus.read (View) / menus.write (Planning & Lifecycle)
 *
 * Invariants:
 * - Single canonical workspace for weekly menus.
 * - Dish Library is master catalog (consumed by dish_id, not duplicated).
 * - WeeklyMenuService is the sole application authority (Supabase persistence).
 * - Full Monday–Sunday operational planning with slot add/remove, duplicate, publish, unpublish, archive.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileCheck,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UtensilsCrossed,
  Archive,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishService } from "@/services/dish-service";
import { WeeklyMenuService } from "@/modules/weekly-menu/application/weekly-menu-service";
import {
  utcWeekDates,
  utcWeekStartMonday,
  isValidMondayIso,
  offsetWeekMonday,
  formatDayDateEs,
  formatWeekRangeEs,
} from "@/modules/weekly-menu/application/week-dates";
import type {
  WeeklyMenuRow,
  WeeklyMenuSlotWithDish,
} from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import { AdminHeader, PanelCard, SectionTitle, StatusChip } from "@/components/admin";
import { BootstrapReadinessBanner } from "@/components/tenant/bootstrap-readiness-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type MenuSearch = {
  weekStart?: string;
};

export const Route = createFileRoute("/_authenticated/admin/menus")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => ({
    weekStart:
      typeof search.weekStart === "string" && isValidMondayIso(search.weekStart)
        ? search.weekStart
        : undefined,
  }),
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
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentMondayIso = useMemo(() => utcWeekStartMonday(), []);
  const selectedWeekStart = searchParams.weekStart ?? currentMondayIso;

  const [menus, setMenus] = useState<WeeklyMenuRow[]>([]);
  const [currentMenu, setCurrentMenu] = useState<WeeklyMenuRow | null>(null);
  const [slots, setSlots] = useState<WeeklyMenuSlotWithDish[]>([]);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Dialogs & Modal States
  const [dishPickerDay, setDishPickerDay] = useState<string | null>(null);
  const [dishFilterQuery, setDishFilterQuery] = useState("");
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<WeeklyMenuSlotWithDish | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const getServiceContext = useCallback(async () => {
    if (!user || !tenantId) throw new Error("Missing auth context");
    return createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
  }, [user, tenantId, roles]);

  const loadData = useCallback(
    async (targetWeek: string) => {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const [menuList, dishList] = await Promise.all([
          WeeklyMenuService.list(ctx),
          DishService.list(ctx),
        ]);
        setMenus(menuList);
        setDishes(dishList);

        const foundMenu =
          menuList.find((m) => m.week_start === targetWeek && m.status !== "archived") ??
          menuList.find((m) => m.week_start === targetWeek) ??
          null;

        setCurrentMenu(foundMenu);

        if (foundMenu) {
          const slotList = await WeeklyMenuService.listSlots(ctx, foundMenu.id);
          setSlots(slotList);
        } else {
          setSlots([]);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al cargar los menús semanales.");
      } finally {
        setLoading(false);
      }
    },
    [getServiceContext],
  );

  useEffect(() => {
    loadData(selectedWeekStart);
  }, [selectedWeekStart, loadData]);

  function changeWeek(weekStart: string) {
    navigate({
      search: (prev) => ({ ...prev, weekStart }),
    });
  }

  // Identify previous week menu for duplicate action
  const previousWeekStart = useMemo(
    () => offsetWeekMonday(selectedWeekStart, -1),
    [selectedWeekStart],
  );
  const nextWeekStart = useMemo(() => offsetWeekMonday(selectedWeekStart, 1), [selectedWeekStart]);

  const previousWeekMenu = useMemo(
    () => menus.find((m) => m.week_start === previousWeekStart && m.status !== "archived") ?? null,
    [menus, previousWeekStart],
  );

  const weekDays = useMemo(() => utcWeekDates(selectedWeekStart), [selectedWeekStart]);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = new Map<string, WeeklyMenuSlotWithDish[]>();
    for (const day of weekDays) {
      map.set(day, []);
    }
    for (const slot of slots) {
      if (!slot.day_date) continue;
      const list = map.get(slot.day_date);
      if (list) {
        list.push(slot);
      }
    }
    return map;
  }, [weekDays, slots]);

  // Dish Picker filtered list
  const filteredDishes = useMemo(() => {
    const q = dishFilterQuery.trim().toLowerCase();
    if (!q) return dishes;
    return dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.allergens?.some((a) => a.toLowerCase().includes(q)),
    );
  }, [dishes, dishFilterQuery]);

  // Operational Actions
  async function handleEnsureDraft() {
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      const draft = await WeeklyMenuService.ensureDraft(ctx, selectedWeekStart);
      toast.success(`Borrador creado para la semana ${formatWeekRangeEs(selectedWeekStart)}`);
      await loadData(draft.week_start ?? selectedWeekStart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el borrador.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDish(dishId: string) {
    if (!currentMenu || !dishPickerDay) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      await WeeklyMenuService.addDishToDay(ctx, {
        weeklyMenuId: currentMenu.id,
        dayDate: dishPickerDay,
        dishId,
      });
      toast.success("Plato añadido al día");
      const updatedSlots = await WeeklyMenuService.listSlots(ctx, currentMenu.id);
      setSlots(updatedSlots);
      setDishPickerDay(null);
      setDishFilterQuery("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al añadir el plato.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSlot() {
    if (!deleteConfirmSlot || !currentMenu) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      await WeeklyMenuService.removeSlot(ctx, deleteConfirmSlot.id);
      toast.success("Plato eliminado del día");
      const updatedSlots = await WeeklyMenuService.listSlots(ctx, currentMenu.id);
      setSlots(updatedSlots);
      setDeleteConfirmSlot(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el plato.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicatePreviousWeek() {
    if (!previousWeekMenu) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      const duplicated = await WeeklyMenuService.duplicateWeek(ctx, {
        sourceMenuId: previousWeekMenu.id,
        targetWeekStart: selectedWeekStart,
      });
      toast.success("Platos de la semana anterior duplicados correctamente");
      setDuplicateConfirmOpen(false);
      await loadData(duplicated.week_start ?? selectedWeekStart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al duplicar la semana.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!currentMenu) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      await WeeklyMenuService.publish(ctx, currentMenu.id);
      toast.success("Menú semanal publicado con éxito — visible para clientes");
      setPublishConfirmOpen(false);
      await loadData(currentMenu.week_start ?? selectedWeekStart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar el menú.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    if (!currentMenu) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      await WeeklyMenuService.unpublish(ctx, currentMenu.id);
      toast.success("Menú abierto para edición (borrador)");
      setUnpublishConfirmOpen(false);
      await loadData(currentMenu.week_start ?? selectedWeekStart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reabrir el menú.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (!currentMenu) return;
    setBusy(true);
    try {
      const ctx = await getServiceContext();
      await WeeklyMenuService.archiveMenu(ctx, currentMenu.id);
      toast.success("Menú semanal archivado");
      setArchiveConfirmOpen(false);
      await loadData(currentMenu.week_start ?? selectedWeekStart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al archivar el menú.");
    } finally {
      setBusy(false);
    }
  }

  const isDraft = currentMenu?.status === "draft";
  const isPublished = currentMenu?.status === "published";
  const isArchived = currentMenu?.status === "archived";
  const canWrite = can("menus.write");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <SectionTitle
          overline="Operaciones · Catálogo y Planificación"
          title="Menús semanales"
          subtitle="Planifica, revisa y publica la oferta semanal de platos para clientes."
        />
        <AdminHeader
          goal="Planificación de Menús"
          capability="menus.write"
          object="WeeklyMenu · MenuSlot · DishLibrary"
        />
      </div>

      <BootstrapReadinessBanner focus={["BOOTSTRAP_NO_DISHES", "BOOTSTRAP_EMPTY_MENU"]} />

      {/* Week Navigator & Action Bar */}
      <PanelCard className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => changeWeek(previousWeekStart)}
              disabled={busy}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <Button
              type="button"
              variant={selectedWeekStart === currentMondayIso ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeWeek(currentMondayIso)}
              disabled={busy}
            >
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Semana actual
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => changeWeek(nextWeekStart)}
              disabled={busy}
              aria-label="Semana siguiente"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Operational Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!currentMenu && canWrite ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleEnsureDraft}
                disabled={busy}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Crear borrador de esta semana
              </Button>
            ) : null}

            {isDraft && canWrite ? (
              <>
                {previousWeekMenu ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDuplicateConfirmOpen(true)}
                    disabled={busy || slots.length > 0}
                    title={
                      slots.length > 0
                        ? "Solo se puede duplicar en un borrador vacío"
                        : "Copiar oferta de la semana anterior"
                    }
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Duplicar semana anterior
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveConfirmOpen(true)}
                  disabled={busy}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Archive className="h-4 w-4 mr-1.5" />
                  Archivar borrador
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setPublishConfirmOpen(true)}
                  disabled={busy || slots.length === 0}
                >
                  <FileCheck className="h-4 w-4 mr-1.5" />
                  Publicar menú
                </Button>
              </>
            ) : null}

            {isPublished && canWrite ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnpublishConfirmOpen(true)}
                disabled={busy}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Abrir para editar
              </Button>
            ) : null}
          </div>
        </div>

        {/* Current Selected Week Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold tracking-tight">
              Semana: {formatWeekRangeEs(selectedWeekStart)}
            </h2>
            {currentMenu ? (
              <StatusChip
                label={isPublished ? "PUBLICADO" : isDraft ? "BORRADOR" : "ARCHIVADO"}
                tone={isPublished ? "positive" : isDraft ? "warning" : "neutral"}
              />
            ) : (
              <span className="text-xs text-muted-foreground italic bg-muted px-2 py-0.5 rounded">
                Sin planificar
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {slots.length === 1 ? "1 plato planificado" : `${slots.length} platos planificados`}
          </div>
        </div>
      </PanelCard>

      {/* Main Board: 7 Days (Lunes - Domingo) */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Cargando menú semanal…
        </div>
      ) : !currentMenu ? (
        /* Empty State: No menu for this week */
        <PanelCard className="py-16 px-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-semibold">Esta semana no tiene menú planificado</h3>
            <p className="text-sm text-muted-foreground">
              Comienza creando un borrador para asignar platos a cada día de la semana o copia la
              oferta de la semana anterior.
            </p>
          </div>
          {canWrite ? (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button type="button" onClick={handleEnsureDraft} disabled={busy}>
                <Plus className="h-4 w-4 mr-1.5" />
                Crear borrador de la semana
              </Button>
              {previousWeekMenu ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDuplicateConfirmOpen(true)}
                  disabled={busy}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Duplicar semana anterior
                </Button>
              ) : null}
            </div>
          ) : null}
        </PanelCard>
      ) : (
        /* 7-Day Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {weekDays.map((dayDate) => {
            const { dayName, formattedDate } = formatDayDateEs(dayDate);
            const daySlots = slotsByDay.get(dayDate) ?? [];

            return (
              <div
                key={dayDate}
                className={cn(
                  "flex flex-col rounded-lg border bg-card p-3 shadow-xs transition-colors",
                  daySlots.length === 0 ? "border-border/60 bg-card/50" : "border-border",
                )}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {dayName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      daySlots.length > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {daySlots.length}
                  </span>
                </div>

                {/* Day Slots List */}
                <div className="flex-1 space-y-2 min-h-[140px]">
                  {daySlots.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-center">
                      <p className="text-xs text-muted-foreground italic">Sin platos</p>
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="group relative flex items-start justify-between gap-2 p-2 rounded-md bg-muted/40 hover:bg-muted/80 border border-border/40 text-xs transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="font-medium text-foreground truncate">
                            {slot.dishes?.name ?? "Plato no disponible"}
                          </p>
                          {slot.dishes?.kcal ? (
                            <p className="text-[10px] text-muted-foreground">
                              {slot.dishes.kcal} kcal
                            </p>
                          ) : null}
                          {slot.dishes?.allergens && slot.dishes.allergens.length > 0 ? (
                            <p className="text-[9px] text-muted-foreground/80 truncate mt-0.5">
                              {slot.dishes.allergens.join(", ")}
                            </p>
                          ) : null}
                        </div>

                        {/* Remove Slot Action */}
                        {isDraft && canWrite ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 opacity-80 hover:opacity-100"
                            onClick={() => setDeleteConfirmSlot(slot)}
                            disabled={busy}
                            title="Eliminar plato del día"
                            aria-label={`Eliminar ${slot.dishes?.name ?? "plato"} del ${dayName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Dish Action per Day */}
                {isDraft && canWrite ? (
                  <div className="pt-2 mt-auto border-t border-border/40">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7 text-muted-foreground hover:text-foreground justify-center"
                      onClick={() => {
                        setDishPickerDay(dayDate);
                        setDishFilterQuery("");
                      }}
                      disabled={busy}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Añadir plato
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Dish Picker Modal / Dialog */}
      <Dialog
        open={dishPickerDay !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDishPickerDay(null);
            setDishFilterQuery("");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>
              Añadir plato · {dishPickerDay ? formatDayDateEs(dishPickerDay).dayName : ""} (
              {dishPickerDay ? formatDayDateEs(dishPickerDay).formattedDate : ""})
            </DialogTitle>
            <DialogDescription>
              Selecciona un plato del catálogo maestro (Dish Library) para incorporarlo a este día.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar plato por nombre, descripción o alérgenos…"
              value={dishFilterQuery}
              onChange={(e) => setDishFilterQuery(e.target.value)}
              className="pl-9 text-sm"
              autoFocus
            />
          </div>

          {/* Dishes List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[350px] pr-1 divide-y divide-border/30">
            {filteredDishes.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No se encontraron platos activos que coincidan con la búsqueda.
              </p>
            ) : (
              filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/60 rounded-md transition-colors gap-3 pt-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{dish.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {dish.kcal ? <span>{dish.kcal} kcal</span> : null}
                      {dish.price ? (
                        <span>
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          }).format(dish.price)}
                        </span>
                      ) : null}
                      {dish.allergens && dish.allergens.length > 0 ? (
                        <span className="truncate max-w-[200px]">
                          Alérgenos: {dish.allergens.join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddDish(dish.id)}
                    disabled={busy}
                    className="shrink-0 text-xs h-8"
                  >
                    Seleccionar
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDishPickerDay(null);
                setDishFilterQuery("");
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Slot Confirmation Alert Dialog */}
      <AlertDialog
        open={deleteConfirmSlot !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmSlot(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plato del menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará{" "}
              <strong className="text-foreground font-semibold">
                {deleteConfirmSlot?.dishes?.name ?? "este plato"}
              </strong>{" "}
              de la planificación del{" "}
              {deleteConfirmSlot?.day_date ? formatDayDateEs(deleteConfirmSlot.day_date).dayName : "día"}. Podrás
              volver a añadirlo en cualquier momento mientras el menú esté en borrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveSlot}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar plato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Previous Week Confirmation Alert Dialog */}
      <AlertDialog open={duplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Duplicar semana anterior?</AlertDialogTitle>
            <AlertDialogDescription>
              Se copiarán todos los platos de la semana anterior (
              <strong className="text-foreground">
                {previousWeekMenu?.week_start ? formatWeekRangeEs(previousWeekMenu.week_start) : "semana anterior"}
              </strong>
              ) a la semana actual (
              <strong className="text-foreground">{formatWeekRangeEs(selectedWeekStart)}</strong>)
              conservando la correspondencia de días (Lunes a Domingo).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicatePreviousWeek} disabled={busy}>
              Duplicar semana
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Menu Confirmation Alert Dialog */}
      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar menú semanal?</AlertDialogTitle>
            <AlertDialogDescription>
              Al publicar, la oferta semanal pasará a estar disponible de forma oficial para que los
              clientes puedan realizar pedidos desde la aplicación. Si necesitas hacer cambios
              posteriores, podrás reabrir el menú a borrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={busy}>
              Publicar menú
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Menu Confirmation Alert Dialog */}
      <AlertDialog open={unpublishConfirmOpen} onOpenChange={setUnpublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abrir menú para editar?</AlertDialogTitle>
            <AlertDialogDescription>
              El menú volverá a estado <strong className="text-foreground">Borrador</strong> para
              permitir añadir o eliminar platos. Recuerda volver a publicarlo al finalizar las
              modificaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish} disabled={busy}>
              Abrir para editar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Menu Confirmation Alert Dialog */}
      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar borrador de menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta semana quedará archivada y no podrá seguir editándose. Los menús archivados se
              conservan para fines de auditoría histórica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archivar menú
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
