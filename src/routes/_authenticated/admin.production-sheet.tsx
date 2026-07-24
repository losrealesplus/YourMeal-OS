/**
 * EP-002B — Hoja de Producción (digital + print).
 * UI consumes ProductionReportService only — no business logic here.
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileDown,
  Printer,
  RefreshCw,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionTitle } from "@/components/admin";
import {
  ProductionReportService,
  kitchenBatchStatusLabel,
  operationalStatusLabel,
  type KitchenBatchStatus,
  type OperationalOrderStatus,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/production-sheet")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") ||
      roles.includes("company_admin") ||
      roles.includes("operations_manager") ||
      roles.includes("kitchen");
    if (!allowed) {
      throw redirect({ to: "/admin" });
    }
  },
  component: ProductionSheetPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Hoja de Producción" },
      {
        name: "description",
        content: "Hoja de producción diaria a partir de pedidos reales.",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayQty(qty: number | null, unit: string): string {
  if (qty == null) return `— ${unit}`;
  const rounded =
    Math.abs(qty) >= 10 ? Math.round(qty * 10) / 10 : Math.round(qty * 100) / 100;
  return `${rounded} ${unit}`;
}

function ProductionSheetPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const search = Route.useSearch();
  const [date, setDate] = useState(search.date ?? todayISO());
  const [report, setReport] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const model = await ProductionReportService.buildForDay(ctx, {
        deliveryDate: date,
      });
      setReport(model);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo generar la hoja de producción",
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  useEffect(() => {
    void load();
  }, [load]);

  function handlePrint() {
    window.print();
  }

  if (!can("kitchen.operate")) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No tienes permiso de cocina.{" "}
        <Link
          to="/admin"
          className="text-primary underline-offset-4 hover:underline"
        >
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin/kitchen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cocina
            </Link>
          </Button>
          <SectionTitle
            overline="Operaciones"
            title="Hoja de Producción"
            subtitle="Agrupada por plato a partir de pedidos confirmados del día. Sin datos simulados."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin/kitchen-execution" search={{ date }}>
              Ejecución
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!report || loading}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!report || loading}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="sheet-date">Fecha de producción</Label>
          <Input
            id="sheet-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        {report ? (
          <p className="pb-2 text-sm text-muted-foreground">
            {report.totals.orderCount} pedidos · {report.totals.portionCount}{" "}
            raciones · {report.totals.dishCount} platos
            {report.totals.customizationCount > 0
              ? ` · ${report.totals.customizationCount} personalizados`
              : ""}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3 print:hidden">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !report ||
        (report.standardDishes.length === 0 &&
          report.customizations.length === 0) ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground print:hidden">
          No hay pedidos en cola de cocina para esta fecha.
        </div>
      ) : (
        <>
          {/* Digital workspace view — enriched */}
          <div className="space-y-8 print:hidden">
            <DigitalProductionView report={report} />
          </div>

          {/* Paper-like sheet — screen preview + print target */}
          <div className="hidden print:block">
            <PrintableProductionSheet report={report} />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 print:hidden">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Vista para impresión (como la hoja en papel)
            </p>
            <PrintableProductionSheet report={report} />
          </div>
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          aside, header, nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function DigitalProductionView({ report }: { report: ProductionReportModel }) {
  return (
    <section className="space-y-4" aria-label="Producción digital">
      <h2 className="text-lg font-semibold tracking-tight">Producción</h2>
      <Accordion type="multiple" className="rounded-xl border border-border bg-card px-4">
        {report.standardDishes.map((dish) => (
          <AccordionItem key={dish.dishId} value={dish.dishId}>
            <AccordionTrigger>
              <span className="flex flex-wrap items-center gap-2 text-left">
                <span className="font-semibold">{dish.dishName}</span>
                <Badge variant="secondary">{dish.totalQty} raciones</Badge>
                <Badge variant="outline">
                  {kitchenBatchStatusLabel(dish.batchStatus as KitchenBatchStatus)}
                </Badge>
                {dish.prepMinutes != null ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {dish.prepMinutes} min
                  </span>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-2">
                {dish.allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {dish.allergens.map((a) => (
                      <Badge key={a} variant="outline" className="gap-1 text-xs">
                        <Wheat className="h-3 w-3" />
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {dish.orderStatuses.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Estados:{" "}
                    {dish.orderStatuses
                      .map((s) =>
                        operationalStatusLabel(s as OperationalOrderStatus),
                      )
                      .join(" · ")}
                  </p>
                ) : null}
                <ul className="divide-y divide-border">
                  {dish.customers.map((c) => (
                    <li
                      key={`${c.orderId}-${c.customerId}`}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span>
                        {c.customerName}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {operationalStatusLabel(
                            c.orderStatus as OperationalOrderStatus,
                          )}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums">×{c.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {report.customizations.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Personalizados</h3>
          <ul className="mt-3 divide-y divide-border">
            {report.customizations.map((c) => (
              <li key={`${c.orderId}-${c.dishId}`} className="py-3 text-sm">
                <p className="font-semibold">{c.customerName}</p>
                <p className="mt-0.5">
                  {c.dishName}{" "}
                  <span className="font-mono tabular-nums">×{c.qty}</span>
                </p>
                <p className="mt-1 text-muted-foreground">{c.observation}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.ingredientSummary.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Resumen de producción</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {report.ingredientSummary.map((ing) => (
              <li
                key={`${ing.ingredientId}-${ing.unit}`}
                className="flex items-center justify-between text-sm"
              >
                <span>{ing.name}</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatDisplayQty(ing.displayQty, ing.displayUnit)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin resumen de ingredientes: no hay recetas (`dish_ingredients`) para
          los platos del día.
        </p>
      )}
    </section>
  );
}

/** Paper-faithful layout for print / PDF (browser print-to-PDF). */
function PrintableProductionSheet({
  report,
}: {
  report: ProductionReportModel;
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-8 bg-white text-black">
      <header className="border-b border-black pb-3">
        <p className="text-xs uppercase tracking-[0.2em]">EatClean · Cocina</p>
        <h1 className="mt-1 text-2xl font-bold">Hoja de Producción</h1>
        <p className="mt-1 text-sm">
          Fecha: <strong>{report.deliveryDate}</strong>
        </p>
      </header>

      {report.standardDishes.map((dish) => (
        <section key={dish.dishId} className="break-inside-avoid">
          <h2 className="text-lg font-bold underline decoration-2 underline-offset-4">
            {dish.dishName}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-wide">
            Estado: {kitchenBatchStatusLabel(dish.batchStatus as KitchenBatchStatus)}
          </p>
          <ul className="mt-2 space-y-0.5 text-sm">
            {dish.customers.map((c) => (
              <li key={`${c.orderId}-${c.customerId}`}>
                {c.customerName}
                {c.qty > 1 ? ` (×${c.qty})` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-semibold">Total: {dish.totalQty}</p>
        </section>
      ))}

      {report.customizations.length > 0 ? (
        <section className="break-inside-avoid border-t border-black pt-4">
          <h2 className="text-lg font-bold uppercase">Personalizados</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {report.customizations.map((c) => (
              <li key={`${c.orderId}-${c.dishId}`}>
                <p className="font-semibold">{c.customerName}</p>
                <p>
                  {c.dishName} ×{c.qty}
                </p>
                <p>Observación: {c.observation}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.ingredientSummary.length > 0 ? (
        <section className="break-inside-avoid border-t border-black pt-4">
          <h2 className="text-lg font-bold">Resumen de producción</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {report.ingredientSummary.map((ing) => (
              <li
                key={`print-${ing.ingredientId}-${ing.unit}`}
                className="flex justify-between gap-4"
              >
                <span>{ing.name}</span>
                <span className="font-semibold tabular-nums">
                  {formatDisplayQty(ing.displayQty, ing.displayUnit)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
