import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChefHat,
  Plus,
  RefreshCw,
  FileText,
  Utensils,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  MonthlyOperationsService,
  type MonthlyDayOperationalMetrics,
  type MonthlyOperationsSummary,
} from "@/modules/operations";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MonthlyOperationsCalendarProps {
  initialMonth?: string; // YYYY-MM
  onSelectDate?: (date: string) => void;
  className?: string;
}

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_HEADER_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getCurrentMonthISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftMonth(monthStr: string, delta: number): string {
  const [yearStr, monthNumStr] = monthStr.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10) + delta;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getFirstDayOffset(monthStr: string): number {
  // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
  // Convert to Mon=0, Tue=1, ..., Sun=6
  const date = new Date(`${monthStr}-01T00:00:00Z`);
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function MonthlyOperationsCalendar({
  initialMonth,
  onSelectDate,
  className,
}: MonthlyOperationsCalendarProps) {
  const { user, tenantId, roles } = useAuth();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState<string>(
    initialMonth ?? getCurrentMonthISO(),
  );
  const [summary, setSummary] = useState<MonthlyOperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Drawer state for quick order intake
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeDate, setIntakeDate] = useState<string>(getTodayISO());

  const todayIso = useMemo(() => getTodayISO(), []);

  const monthLabel = useMemo(() => {
    const [yearStr, monthNumStr] = currentMonth.split("-");
    const mIdx = parseInt(monthNumStr, 10) - 1;
    return `${MONTH_NAMES_ES[mIdx] || ""} ${yearStr}`;
  }, [currentMonth]);

  const firstDayOffset = useMemo(
    () => getFirstDayOffset(currentMonth),
    [currentMonth],
  );

  const loadSummary = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const data = await MonthlyOperationsService.getMonthlySummary(ctx, {
        month: currentMonth,
      });
      setSummary(data);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Error al cargar el resumen operativo mensual",
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, currentMonth]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const activeDaysCount = useMemo(() => {
    if (!summary) return 0;
    return summary.days.filter((d) => d.status !== "empty").length;
  }, [summary]);

  const handleOpenIntake = (dayDate: string) => {
    setIntakeDate(dayDate);
    setIntakeOpen(true);
  };

  const handleDayClick = (dayDate: string) => {
    if (onSelectDate) {
      onSelectDate(dayDate);
    } else {
      void navigate({
        to: "/admin/production-sheet",
        search: { date: dayDate },
      });
    }
  };

  const renderStatusBadge = (status: MonthlyDayOperationalMetrics["status"]) => {
    switch (status) {
      case "in_kitchen":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-medium"
          >
            🟡 En Cocina
          </Badge>
        );
      case "ready":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-medium"
          >
            🟢 Listo
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="text-[10px] text-muted-foreground font-medium"
          >
            ⚪ Borradores
          </Badge>
        );
      case "empty":
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground border-dashed border-border font-normal"
          >
            ⚪ Sin pedidos
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. HEADER & KPIS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">
              Calendario Mensual Operativo
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vista integral de demanda, raciones y estado de cocina por día.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => shiftMonth(m, -1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[130px] text-center text-sm font-semibold px-2">
              {monthLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => shiftMonth(m, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadSummary()}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")}
            />
            Actualizar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenIntake(todayIso)}
            className="h-9 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            + Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-none border-border bg-card/60">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total Raciones Mes
              <Utensils className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold font-mono text-foreground">
              {summary ? summary.totalMonthlyPortions : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Raciones acumuladas en el mes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border bg-card/60">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Pedidos Únicos Mes
              <PackageCheck className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold font-mono text-foreground">
              {summary ? summary.totalMonthlyOrders : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Órdenes programadas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border bg-card/60">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Días con Producción
              <ChefHat className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold font-mono text-foreground">
              {summary ? `${activeDaysCount} / ${summary.totalDays}` : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Días activos de cocina
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. CALENDAR GRID */}
      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : !summary ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No se pudieron cargar los datos del mes seleccionado.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {WEEK_HEADER_ES.map((header) => (
              <div key={header} className="py-1">
                {header}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank padding cells before 1st of month */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div
                key={`empty-offset-${idx}`}
                className="h-32 rounded-lg border border-dashed border-border/40 bg-muted/10 opacity-30"
              />
            ))}

            {/* Month Day Cells */}
            {summary.days.map((day) => {
              const dayNum = parseInt(day.dayDate.split("-")[2], 10);
              const isToday = day.dayDate === todayIso;
              const hasActivity = day.status !== "empty";

              return (
                <div
                  key={day.dayDate}
                  className={cn(
                    "group relative flex flex-col justify-between h-32 p-2.5 rounded-lg border transition-all text-left",
                    isToday
                      ? "border-primary/80 bg-primary/5 ring-1 ring-primary/30"
                      : hasActivity
                        ? "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                        : "border-border/60 bg-card/40 hover:bg-card/70",
                  )}
                >
                  {/* Top Bar: Date + Menu Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono inline-flex items-center justify-center h-6 w-6 rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {dayNum}
                    </span>

                    {day.menuPublished ? (
                      <span
                        title="Menú publicado para este día"
                        className="inline-flex items-center text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                      >
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                        Menú
                      </span>
                    ) : null}
                  </div>

                  {/* Middle Content: Metrics & Status */}
                  <div className="space-y-1.5 my-1">
                    <div>{renderStatusBadge(day.status)}</div>

                    {hasActivity ? (
                      <div className="space-y-0.5 text-[11px]">
                        <p className="font-semibold text-foreground font-mono">
                          {day.totalPortions} rac.
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {day.totalCustomers} cli. · {day.totalOrders} ped.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">
                        Sin carga
                      </p>
                    )}
                  </div>

                  {/* Action Buttons (Hover / Touch) */}
                  <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDayClick(day.dayDate)}
                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground flex-1 justify-start gap-1"
                      title="Ver Hoja de Producción"
                    >
                      <FileText className="h-3 w-3" />
                      Hoja
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenIntake(day.dayDate)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                      title="Crear pedido para este día"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Order Intake Drawer */}
      <UniversalOrderIntakeDrawer
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        initialDayDate={intakeDate}
        onSuccess={() => void loadSummary()}
      />
    </div>
  );
}
