/**
 * EP-002B — Hoja de Producción (digital + print).
 * UI consumes ProductionReportService only — no business logic here.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileDown,
  Printer,
  RefreshCw,
  Wheat,
  Utensils,
  Users,
  Package,
  CheckSquare,
  AlertTriangle,
  ChefHat,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: ProductionSheetPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Hoja de Producción y Packing" },
      {
        name: "description",
        content: "Hoja de producción de 2 niveles (Cocina P1 + Packing P2+) a partir de pedidos reales.",
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
  const [levelTab, setLevelTab] = useState<"p1_kitchen" | "p2_packing_client" | "p2_packing_dish">("p1_kitchen");

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
            title="Hoja de Producción & Packing (2 Niveles)"
            subtitle="P1: Cocina y Marmitas · P2: Packing por Cliente y por Plato. Sin datos simulados."
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
          {/* Digital 2-Level View */}
          <div className="space-y-6 print:hidden">
            <Tabs
              value={levelTab}
              onValueChange={(v) => setLevelTab(v as any)}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="p1_kitchen" className="gap-2">
                  <ChefHat className="h-4 w-4" />
                  P1 · Cocina & Marmitas
                </TabsTrigger>
                <TabsTrigger value="p2_packing_client" className="gap-2">
                  <Users className="h-4 w-4" />
                  P2 · Packing por Cliente
                </TabsTrigger>
                <TabsTrigger value="p2_packing_dish" className="gap-2">
                  <Package className="h-4 w-4" />
                  P2 · Packing por Plato
                </TabsTrigger>
              </TabsList>

              <TabsContent value="p1_kitchen" className="space-y-6">
                <DigitalKitchenP1View report={report} />
              </TabsContent>

              <TabsContent value="p2_packing_client" className="space-y-6">
                <DigitalPackingByClientView report={report} />
              </TabsContent>

              <TabsContent value="p2_packing_dish" className="space-y-6">
                <DigitalPackingByDishView report={report} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Paper-like sheet for Print / PDF */}
          <div className="hidden print:block">
            <PrintableProductionSheet report={report} />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 print:hidden">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Vista previa para impresión (formato físico de 2 niveles)
            </p>
            <PrintableProductionSheet report={report} />
          </div>
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside, header, nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
          .page-break { page-break-after: always; break-after: page; }
        }
      `}</style>
    </div>
  );
}

/** NIVEL 1 — COCINA & MARMITAS */
function DigitalKitchenP1View({ report }: { report: ProductionReportModel }) {
  return (
    <section className="space-y-6" aria-label="Nivel 1 Cocina y Marmitas">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Total Raciones</p>
          <p className="text-2xl font-bold font-mono text-primary mt-1">{report.totals.portionCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Platos Distintos</p>
          <p className="text-2xl font-bold font-mono mt-1">{report.totals.dishCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Clientes Activos</p>
          <p className="text-2xl font-bold font-mono mt-1">{report.packingByCustomer.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Personalizados</p>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{report.totals.customizationCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold tracking-tight">Marmitas y Platos a Cocinar</h3>
        <Accordion type="multiple" className="rounded-xl border border-border bg-card px-4">
          {report.standardDishes.map((dish) => (
            <AccordionItem key={dish.dishId} value={dish.dishId}>
              <AccordionTrigger>
                <span className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-semibold">{dish.dishName}</span>
                  <Badge variant="secondary" className="font-mono font-bold">
                    {dish.totalQty} raciones
                  </Badge>
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
                        <Badge key={a} variant="outline" className="gap-1 text-xs text-amber-700 bg-amber-50">
                          <Wheat className="h-3 w-3" />
                          {a}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <ul className="divide-y divide-border text-sm">
                    {dish.customers.map((c) => (
                      <li
                        key={`${c.orderId}-${c.customerId}`}
                        className="flex items-center justify-between py-2"
                      >
                        <span>{c.customerName}</span>
                        <span className="font-mono tabular-nums font-semibold">×{c.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {report.customizations.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Modificaciones y Alérgenos Especiales Cocina
          </h3>
          <ul className="divide-y divide-amber-200/70">
            {report.customizations.map((c) => (
              <li key={`${c.orderId}-${c.dishId}`} className="py-2.5 text-sm">
                <p className="font-semibold text-amber-950">{c.customerName}</p>
                <p className="text-xs text-amber-900">
                  {c.dishName} <span className="font-mono font-bold">×{c.qty}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-800 bg-amber-100/80 px-2 py-1 rounded inline-block">
                  ⚠️ {c.observation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.ingredientSummary.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold">Resumen de Ingredientes de Producción</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.ingredientSummary.map((ing) => (
              <li
                key={`${ing.ingredientId}-${ing.unit}`}
                className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/40 border border-border/50"
              >
                <span>{ing.name}</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatDisplayQty(ing.displayQty, ing.displayUnit)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** NIVEL 2 — PACKING POR CLIENTE */
function DigitalPackingByClientView({ report }: { report: ProductionReportModel }) {
  return (
    <section className="space-y-4" aria-label="Nivel 2 Packing por Cliente">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Checklist de Emplatado y Packing por Cliente</h3>
        <Badge variant="outline" className="font-mono">
          {report.packingByCustomer.length} Clientes
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {report.packingByCustomer.map((cust) => (
          <div
            key={`${cust.customerId}-${cust.orderId}`}
            className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <p className="font-bold text-base leading-tight">{cust.customerName}</p>
                  <p className="text-xs text-muted-foreground font-mono">Pedido #{cust.orderId.slice(0, 8)}</p>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {cust.totalPortions} raciones
                </Badge>
              </div>

              {cust.specialInstructions.length > 0 ? (
                <div className="my-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    Observaciones cliente:
                  </p>
                  {cust.specialInstructions.map((ins, i) => (
                    <p key={i} className="pl-4 italic">
                      • {ins}
                    </p>
                  ))}
                </div>
              ) : null}

              <ul className="divide-y divide-border/60 pt-1 space-y-1.5">
                {cust.items.map((item, idx) => (
                  <li key={`${item.dishId}-${idx}`} className="pt-1.5 flex items-start justify-between gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium leading-tight">{item.dishName}</p>
                        {item.comment ? (
                          <p className="text-xs text-amber-700 font-medium">⚠️ {item.comment}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="font-mono font-bold tabular-nums">×{item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between items-center">
              <span>Packing listo</span>
              <span className="font-mono">[ ] Verificado</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** NIVEL 2 — PACKING POR PLATO */
function DigitalPackingByDishView({ report }: { report: ProductionReportModel }) {
  return (
    <section className="space-y-4" aria-label="Nivel 2 Packing por Plato">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Distribución de Raciones por Plato</h3>
        <Badge variant="outline" className="font-mono">
          {report.packingByDish.length} Platos
        </Badge>
      </div>

      <div className="space-y-4">
        {report.packingByDish.map((dish) => (
          <div key={dish.dishId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span className="font-bold text-base">{dish.dishName}</span>
              </div>
              <Badge variant="secondary" className="font-mono text-sm font-bold">
                Total: {dish.totalQty} raciones
              </Badge>
            </div>

            {dish.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {dish.allergens.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {dish.allocations.map((alloc, i) => (
                <div
                  key={`${alloc.customerId}-${i}`}
                  className="p-2.5 rounded-lg border border-border/70 bg-muted/20 text-sm flex items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-medium text-xs">{alloc.customerName}</p>
                    {alloc.comment ? (
                      <p className="text-[11px] text-amber-700 font-medium">⚠️ {alloc.comment}</p>
                    ) : null}
                  </div>
                  <span className="font-mono font-bold text-xs">×{alloc.qty}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** FORMATO FÍSICO 2 NIVELES PARA IMPRESIÓN (PRINT / PDF) */
function PrintableProductionSheet({ report }: { report: ProductionReportModel }) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 bg-white text-black font-sans text-sm">
      {/* ========================================================================= */}
      {/* PÁGINA 1 (P1) — COCINA & PRODUCCIÓN (MARMITAS / TOTALES / ALÉRGENOS) */}
      {/* ========================================================================= */}
      <section className="page-break space-y-6 pb-6">
        <header className="border-b-2 border-black pb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold tracking-[0.2em] text-gray-700">
                EatClean · Operaciones de Cocina
              </p>
              <h1 className="text-2xl font-black mt-0.5">HOJA DE PRODUCCIÓN (P1)</h1>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">Fecha: {report.deliveryDate}</p>
              <p className="text-xs text-gray-600">Impreso: {new Date().toLocaleTimeString("es-ES")}</p>
            </div>
          </div>
        </header>

        {/* Resumen Global */}
        <div className="grid grid-cols-4 gap-2 border border-black p-3 bg-gray-50 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-600">Total Raciones</p>
            <p className="text-xl font-black font-mono">{report.totals.portionCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-600">Total Platos</p>
            <p className="text-xl font-black font-mono">{report.totals.dishCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-600">Total Clientes</p>
            <p className="text-xl font-black font-mono">{report.packingByCustomer.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-600">Personalizados</p>
            <p className="text-xl font-black font-mono">{report.totals.customizationCount}</p>
          </div>
        </div>

        {/* Listado de Platos a Cocinar */}
        <div>
          <h2 className="text-base font-bold uppercase border-b border-black pb-1 mb-3">
            1. Cocinado y Marmitas por Plato
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black text-xs uppercase bg-gray-100">
                <th className="py-1.5 px-2">Plato</th>
                <th className="py-1.5 px-2">Alérgenos</th>
                <th className="py-1.5 px-2 text-right">Raciones</th>
                <th className="py-1.5 px-2 text-center">Check Cocina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {report.standardDishes.map((dish) => (
                <tr key={dish.dishId} className="break-inside-avoid">
                  <td className="py-2 px-2 font-bold">{dish.dishName}</td>
                  <td className="py-2 px-2 text-xs">{dish.allergens.join(", ") || "—"}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-base">{dish.totalQty}</td>
                  <td className="py-2 px-2 text-center font-mono">[  ] Listo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modificaciones culinarias */}
        {report.customizations.length > 0 ? (
          <div className="border border-black p-3 space-y-2 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 inline-block">
              ⚠️ Modificaciones Culinarias y Alérgenos por Cliente
            </h2>
            <ul className="divide-y divide-gray-200 text-xs">
              {report.customizations.map((c) => (
                <li key={`${c.orderId}-${c.dishId}`} className="py-1.5 flex justify-between gap-2">
                  <div>
                    <span className="font-bold">{c.customerName}</span> — {c.dishName} (×{c.qty})
                    <p className="italic text-gray-800 font-semibold">Observación: {c.observation}</p>
                  </div>
                  <span className="font-mono">[  ]</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Ingredientes si existen */}
        {report.ingredientSummary.length > 0 ? (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
              Resumen de Ingredientes
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {report.ingredientSummary.map((ing) => (
                <div key={`${ing.ingredientId}-${ing.unit}`} className="flex justify-between border-b border-gray-200 py-0.5">
                  <span>{ing.name}</span>
                  <span className="font-mono font-bold">{formatDisplayQty(ing.displayQty, ing.displayUnit)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* PÁGINAS 2+ (P2+) — PACKING & EMPLATADO (POR CLIENTE) */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-6">
        <header className="border-b-2 border-black pb-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold tracking-[0.2em] text-gray-700">
                EatClean · Mesa de Expedición
              </p>
              <h1 className="text-2xl font-black mt-0.5">HOJA DE PACKING POR CLIENTE (P2)</h1>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">Fecha: {report.deliveryDate}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {report.packingByCustomer.map((cust) => (
            <div
              key={`print-cust-${cust.customerId}-${cust.orderId}`}
              className="border-2 border-black p-3 space-y-2 break-inside-avoid flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-baseline border-b border-black pb-1">
                  <span className="font-black text-base">{cust.customerName}</span>
                  <span className="font-mono text-xs font-bold">Total: {cust.totalPortions}</span>
                </div>

                {cust.specialInstructions.length > 0 ? (
                  <div className="my-1.5 p-1 border border-black bg-gray-100 text-xs">
                    <p className="font-bold">⚠️ Observaciones:</p>
                    {cust.specialInstructions.map((ins, i) => (
                      <p key={i}>• {ins}</p>
                    ))}
                  </div>
                ) : null}

                <ul className="divide-y divide-gray-200 text-xs pt-1 space-y-1">
                  {cust.items.map((item, idx) => (
                    <li key={idx} className="pt-1 flex justify-between items-start gap-1">
                      <div>
                        <span>[  ] {item.dishName}</span>
                        {item.comment ? (
                          <p className="font-semibold text-[11px] pl-4">→ {item.comment}</p>
                        ) : null}
                      </div>
                      <span className="font-mono font-bold">×{item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-400 flex justify-between text-[10px] uppercase font-bold text-gray-700">
                <span>Empacado por: _________</span>
                <span>[  ] OK</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

