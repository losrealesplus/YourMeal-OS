import { buildOperationalLabels } from "@/production-experience/operational-labels";
import { OperationalAllergenDeclaration } from "@/production-experience/operational-item-presentation";
import { brandConfig } from "@/tenant/brand-config";
/**
 * ADMIN · Producción · Etiquetas
 * Capability: kitchen.operate  ·  Core Object: ProductionLabel (portion-level)
 * Reads: ProductionReportService. Genera una etiqueta por ración a partir de pedidos reales.
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw, Wheat } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductionReportService, type ProductionReportModel } from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

export const Route = createFileRoute("/_authenticated/admin/production/labels")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: LabelsPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Etiquetas" }] }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDaysFromDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = curr.getUTCDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(curr);
  monday.setUTCDate(curr.getUTCDate() + diffToMon);

  const days: Array<{ date: string; label: string }> = [];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  for (let i = 0; i < 5; i++) {
    const next = new Date(monday);
    next.setUTCDate(monday.getUTCDate() + i);
    const iso = next.toISOString().slice(0, 10);
    const dd = String(next.getUTCDate()).padStart(2, "0");
    const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
    days.push({
      date: iso,
      label: `${dayNames[i]} ${dd}/${mm}`,
    });
  }
  return days;
}

function LabelsPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get("date");
      if (urlDate) return urlDate;
    }
    return todayISO();
  });
  const [report, setReport] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => getWeekDaysFromDate(date), [date]);
  const brandName = brandConfig?.name || "YourMeal OS";
  const brandTicker = `${brandName} · `.repeat(8);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setReport(await ProductionReportService.buildForDay(ctx, { deliveryDate: date }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron generar las etiquetas");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const labels = useMemo(() => (report ? buildOperationalLabels(report) : []), [report]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Selección Rápida:
            </span>
            <Button
              variant={date === todayISO() ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDate(todayISO())}
            >
              Hoy
            </Button>
            {weekDays.map((d) => (
              <Button
                key={d.date}
                variant={date === d.date ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setDate(d.date)}
              >
                {d.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Label htmlFor="labels-date" className="text-xs font-semibold text-muted-foreground">
              Fecha específica:
            </Label>
            <Input
              id="labels-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            disabled={loading || labels.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Etiquetas
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : labels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground print:hidden">
          No hay etiquetas para esta fecha ({date}).
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground print:hidden">
            {labels.length} etiquetas individuales de envase ·{" "}
            {new Set(labels.map((l) => l.orderId)).size} pedidos
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-2 print:gap-2">
            {labels.map((l) => (
              <article
                key={l.key}
                className="label-sticker flex flex-col justify-between rounded-lg border-2 border-border/80 bg-card p-3 text-xs shadow-sm break-inside-avoid print:border-black print:p-2.5 print:shadow-none"
              >
                {/* Marco de Branding Superior */}
                <div className="overflow-hidden whitespace-nowrap text-[9px] font-black tracking-widest text-primary/70 uppercase select-none pb-1.5 border-b border-border/60 print:text-black">
                  {brandTicker}
                </div>

                {/* Cabecera Logística y Cliente */}
                <div className="pt-2 pb-1.5 space-y-1">
                  <div className="flex justify-between items-baseline text-[10px] text-muted-foreground font-medium print:text-black">
                    <span className="truncate max-w-[180px]">
                      {l.companyName
                        ? `🏢 ${l.companyName}${l.siteName ? ` · ${l.siteName}` : ""}`
                        : "👤 Particular"}
                    </span>
                    <span className="font-mono">{l.deliveryDate ?? date}</span>
                  </div>

                  {l.deliveryAddress ? (
                    <div className="text-[10px] text-muted-foreground truncate print:text-black">
                      📍 {l.deliveryAddress}
                    </div>
                  ) : null}

                  <div className="flex justify-between items-baseline gap-1">
                    <span className="font-bold text-sm text-foreground uppercase truncate print:text-black">
                      {l.customerName}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0 print:text-black">
                      #{l.orderId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Bloque de Plato y Porción */}
                <div className="py-2 border-t border-b border-border/60 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold leading-snug text-foreground print:text-black">
                      {l.dishName}
                    </p>
                    <span className="font-mono font-bold text-xs shrink-0 bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 print:border-black print:bg-white print:text-black">
                      ×{l.totalPortions > 1 ? `${l.portionIndex}/${l.totalPortions}` : "1"} RACIÓN
                    </span>
                  </div>

                  {l.nativeCustom ? (
                    <div className="text-[10px] text-muted-foreground">
                      <span>Receta no vinculada</span>
                      <span className="block font-mono text-[9px]">{l.itemIdentity}</span>
                    </div>
                  ) : null}
                </div>

                {/* Bloque de Alérgenos y Observaciones */}
                <div className="pt-2 pb-2 space-y-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block print:text-black">
                      Alérgenos:
                    </span>
                    <OperationalAllergenDeclaration item={l} />
                    {l.allergenState !== "UNKNOWN" &&
                    l.allergenState !== "HISTORICAL_UNAVAILABLE" &&
                    l.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {l.allergens.map((a) => (
                          <Badge
                            key={a}
                            variant="outline"
                            className="gap-1 text-[10px] py-0 px-1 border-muted-foreground/40 print:border-black"
                          >
                            <Wheat className="h-2.5 w-2.5" />
                            {a}
                          </Badge>
                        ))}
                      </div>
                    ) : l.allergens.length === 0 &&
                      l.allergenState !== "HISTORICAL_UNAVAILABLE" &&
                      !l.isCustom ? (
                      <span className="text-[10px] text-muted-foreground italic block">
                        Sin alérgenos declarados
                      </span>
                    ) : null}
                  </div>

                  {l.note ? (
                    <div className="mt-1 p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-[11px] font-medium print:bg-white print:border-black print:text-black">
                      ⚠️ Obs: {l.note}
                    </div>
                  ) : null}
                </div>

                {/* Marco de Branding Inferior */}
                <div className="overflow-hidden whitespace-nowrap text-[9px] font-black tracking-widest text-primary/70 uppercase select-none pt-1.5 border-t border-border/60 print:text-black">
                  · {brandTicker}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside, header, nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
          .label-sticker { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
