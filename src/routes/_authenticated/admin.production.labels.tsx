/**
 * ADMIN · Producción · Etiquetas
 * Capability: kitchen.operate  ·  Core Object: ProductionLabel (portion-level)
 * Reads: ProductionReportService. Genera una etiqueta por ración a partir de pedidos reales.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
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
import {
  ProductionReportService,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

type LabelRow = {
  key: string;
  orderId: string;
  customerName: string;
  dishName: string;
  allergens: string[];
  note: string | null;
  isCustom: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/production/labels")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    if (!roles.some((r) => ROLES_ALLOWED.includes(r))) throw redirect({ to: "/admin" });
  },
  component: LabelsPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Etiquetas" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function LabelsPage() {
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
      toast.error(e instanceof Error ? e.message : "No se pudieron generar las etiquetas");
      setReport(null);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  const labels = useMemo<LabelRow[]>(() => {
    if (!report) return [];
    const rows: LabelRow[] = [];
    for (const dish of report.standardDishes) {
      for (const c of dish.customers) {
        for (let i = 0; i < c.qty; i++) {
          rows.push({
            key: `${dish.dishId}:${c.orderId}:${c.customerId}:${i}`,
            orderId: c.orderId,
            customerName: c.customerName,
            dishName: dish.dishName,
            allergens: dish.allergens,
            note: c.note,
            isCustom: false,
          });
        }
      }
    }
    for (const cx of report.customizations) {
      for (let i = 0; i < cx.qty; i++) {
        rows.push({
          key: `custom:${cx.dishId}:${cx.orderId}:${cx.customerId}:${i}`,
          orderId: cx.orderId,
          customerName: cx.customerName,
          dishName: cx.dishName,
          allergens: [],
          note: cx.observation,
          isCustom: true,
        });
      }
    }
    return rows;
  }, [report]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="labels-date">Fecha</Label>
          <Input id="labels-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => window.print()} disabled={loading || labels.length === 0}>
            <Printer className="mr-2 h-4 w-4" />Imprimir
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : labels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground print:hidden">
          No hay etiquetas para esta fecha.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground print:hidden">
            {labels.length} etiquetas · {new Set(labels.map((l) => l.orderId)).size} pedidos
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
            {labels.map((l) => (
              <article key={l.key}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-xs print:border-black">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    #{l.orderId.slice(0, 8)}
                  </span>
                  {l.isCustom ? <Badge variant="outline" className="text-[10px]">Custom</Badge> : null}
                </div>
                <p className="text-sm font-semibold leading-tight">{l.dishName}</p>
                <p className="leading-tight text-muted-foreground">{l.customerName}</p>
                {l.allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {l.allergens.map((a) => (
                      <Badge key={a} variant="outline" className="gap-1 text-[10px]">
                        <Wheat className="h-2.5 w-2.5" />{a}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {l.note ? <p className="italic text-muted-foreground">{l.note}</p> : null}
                <p className="mt-auto text-[10px] text-muted-foreground">{date}</p>
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
