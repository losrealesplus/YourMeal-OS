/**
 * ADMIN · Producción · Packaging
 * Capability: kitchen.operate  ·  Core Object: PackagingBag (por pedido / cliente)
 * Reads: ProductionReportService — agrega raciones por pedido para armar bolsas reales.
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ProductionReportService,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

import { DietaryBadges } from "@/components/operations/dietary-badges";
import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";
import type { OrderDietarySnapshot } from "@/types/dietary";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

type BagLine = {
  dishName: string;
  qty: number;
  note: string | null;
  isCustom: boolean;
  kind: "dish" | "custom";
  allergenState: AllergenSnapshotState;
  allergens: string[];
  criticalAlert: string | null;
  safetyTag: string | null;
};

type Bag = {
  orderId: string;
  customerId: string;
  customerName: string;
  totalPortions: number;
  dietarySnapshot?: OrderDietarySnapshot | null;
  lines: BagLine[];
};

export const Route = createFileRoute("/_authenticated/admin/production/packaging")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: PackagingPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Packaging" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function PackagingPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setReport(await ProductionReportService.buildForDay(ctx, { deliveryDate: date }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar packaging");
      setReport(null);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  const bags = useMemo<Bag[]>(() => {
    if (!report) return [];
    const list: Bag[] = [];

    for (const cust of report.packingByCustomer) {
      const customerAllergens = (cust.dietarySnapshot?.allergens ?? []).map((a) =>
        a.toLowerCase().trim(),
      );

      const lines: BagLine[] = cust.items.map((item) => {
        const isCustom = item.kind === "custom";
        const itemAllergens = item.allergens ?? [];
        const allergenState: AllergenSnapshotState =
          item.kind === "custom"
            ? "UNKNOWN"
            : (item.allergenState ?? "HISTORICAL_UNAVAILABLE");

        const matchingCritical = itemAllergens.filter((a) =>
          customerAllergens.includes(a.toLowerCase().trim()),
        );
        const criticalAlert =
          matchingCritical.length > 0 ? matchingCritical.join(", ").toUpperCase() : null;

        let safetyTag: string | null = null;
        if (isCustom) {
          safetyTag = "Alérgenos sin declarar · Receta no vinculada";
        } else if (allergenState === "HISTORICAL_UNAVAILABLE") {
          safetyTag = "Declaración histórica no disponible";
        } else if (allergenState === "UNKNOWN") {
          safetyTag = "Alérgenos sin declarar";
        } else if (criticalAlert) {
          safetyTag = `🔴 ALERTA: ${criticalAlert}`;
        } else if (itemAllergens.length > 0) {
          safetyTag = `Alérgenos: ${itemAllergens.join(", ")}`;
        }

        return {
          dishName: item.dishName,
          qty: item.qty,
          note: item.comment,
          isCustom,
          kind: item.kind ?? "dish",
          allergenState,
          allergens: itemAllergens,
          criticalAlert,
          safetyTag,
        };
      });

      list.push({
        orderId: cust.orderId,
        customerId: cust.customerId,
        customerName: cust.customerName,
        totalPortions: cust.totalPortions,
        dietarySnapshot: cust.dietarySnapshot,
        lines,
      });
    }

    return list.sort((a, b) => a.customerName.localeCompare(b.customerName, "es"));
  }, [report]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="pkg-date">Fecha</Label>
          <Input id="pkg-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => window.print()} disabled={loading || bags.length === 0}>
            <Printer className="mr-2 h-4 w-4" />Imprimir
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : bags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground print:hidden">
          No hay bolsas de packaging para esta fecha.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground print:hidden">
            {bags.length} bolsas · {bags.reduce((s, b) => s + b.totalPortions, 0)} raciones
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bags.map((bag) => (
              <article key={`${bag.orderId}:${bag.customerId}`}
                className="rounded-xl border border-border bg-card p-4 print:border-black space-y-3">
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{bag.customerName}</p>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">
                      #{bag.orderId.slice(0, 8)}
                    </p>
                    {bag.dietarySnapshot && (
                      <DietaryBadges snapshot={bag.dietarySnapshot} compact className="mt-1" />
                    )}
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Package className="h-3 w-3" />{bag.totalPortions}
                  </Badge>
                </header>
                <ul className="space-y-2 text-sm divide-y divide-border/40 pt-1">
                  {bag.lines.map((l, i) => (
                    <li key={i} className="pt-1.5 flex items-start justify-between gap-2">
                      <div className="space-y-0.5 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{l.dishName}</span>
                          {l.isCustom ? (
                            <Badge variant="outline" className="text-[10px] uppercase font-semibold text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800">
                              Custom
                            </Badge>
                          ) : null}
                        </div>
                        {l.criticalAlert ? (
                          <Badge variant="destructive" className="h-4 px-1 text-[10px] font-bold">
                            🔴 ALERTA: {l.criticalAlert}
                          </Badge>
                        ) : null}
                        {l.kind === "custom" || l.allergenState === "UNKNOWN" ? (
                          <span className="block text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            ⚠️ Alérgenos sin declarar · Receta no vinculada
                          </span>
                        ) : l.allergenState === "HISTORICAL_UNAVAILABLE" ? (
                          <span className="block text-[11px] text-muted-foreground italic">
                            Declaración histórica no disponible
                          </span>
                        ) : l.allergens.length > 0 ? (
                          <span className="block text-[11px] text-muted-foreground">
                            Alérgenos: {l.allergens.join(", ")}
                          </span>
                        ) : null}
                        {l.note ? (
                          <span className="block text-xs italic text-amber-700 dark:text-amber-400 font-medium">
                            🟡 {l.note}
                          </span>
                        ) : null}
                      </div>
                      <span className="tabular-nums font-bold text-foreground">×{l.qty}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media print {
          aside, header, nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
