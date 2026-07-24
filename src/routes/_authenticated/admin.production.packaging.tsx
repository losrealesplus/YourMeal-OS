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

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

type BagLine = { dishName: string; qty: number; note: string | null; isCustom: boolean };
type Bag = {
  orderId: string;
  customerId: string;
  customerName: string;
  totalPortions: number;
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
    const map = new Map<string, Bag>();
    const push = (
      orderId: string, customerId: string, customerName: string,
      line: BagLine,
    ) => {
      const key = `${orderId}:${customerId}`;
      let bag = map.get(key);
      if (!bag) {
        bag = { orderId, customerId, customerName, totalPortions: 0, lines: [] };
        map.set(key, bag);
      }
      bag.lines.push(line);
      bag.totalPortions += line.qty;
    };

    for (const dish of report.standardDishes) {
      for (const c of dish.customers) {
        push(c.orderId, c.customerId, c.customerName, {
          dishName: dish.dishName, qty: c.qty, note: c.note, isCustom: false,
        });
      }
    }
    for (const cx of report.customizations) {
      push(cx.orderId, cx.customerId, cx.customerName, {
        dishName: cx.dishName, qty: cx.qty, note: cx.observation, isCustom: true,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
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
                className="rounded-xl border border-border bg-card p-4 print:border-black">
                <header className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{bag.customerName}</p>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">
                      #{bag.orderId.slice(0, 8)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />{bag.totalPortions}
                  </Badge>
                </header>
                <ul className="space-y-1.5 text-sm">
                  {bag.lines.map((l, i) => (
                    <li key={i} className="flex items-start justify-between gap-2">
                      <span className="leading-tight">
                        {l.dishName}
                        {l.isCustom ? <Badge variant="outline" className="ml-1 text-[10px]">Custom</Badge> : null}
                        {l.note ? <span className="block text-xs italic text-muted-foreground">{l.note}</span> : null}
                      </span>
                      <span className="tabular-nums font-medium">×{l.qty}</span>
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
