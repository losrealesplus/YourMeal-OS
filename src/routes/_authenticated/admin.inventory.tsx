/**
 * ADMIN · Operational Inventory & Movement Ledger (Kárdex)
 * Capability: inventory.operate
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Package,
  Boxes,
  Layers,
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  ShoppingCart,
  UtensilsCrossed,
  Filter,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { InventoryService } from "@/modules/inventory/application/inventory-service";
import type {
  InventoryStockItem,
  StockMovementRecord,
  InventorySummary,
} from "@/modules/inventory/domain/inventory-types";
import { AdminHeader, DataTable, KpiCard, PanelCard, SectionTitle } from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "inventory.operate");
  },
  component: AdminInventoryPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Inventario & Kárdex" },
      {
        name: "description",
        content: "Control de existencias de ingredientes, coste medio ponderado y trazabilidad de movimientos.",
      },
    ],
  }),
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatQty(qty: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(qty);
}

function formatCost(cost: number, unit: string): string {
  return `${cost.toLocaleString("es-ES", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} €/${unit}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminInventoryPage() {
  const { user, tenantId, roles } = useAuth();

  const [items, setItems] = useState<InventoryStockItem[]>([]);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("stock");

  // Stock filters
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Movement filters
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");
  const [movementIngredientFilter, setMovementIngredientFilter] = useState<string>("all");

  async function loadData() {
    if (!user || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const [stockData, movementsData, summaryData] = await Promise.all([
        InventoryService.getInventoryStock(ctx),
        InventoryService.getStockMovements(ctx, { limit: 150 }),
        InventoryService.getInventorySummary(ctx),
      ]);

      setItems(stockData);
      setMovements(movementsData);
      setSummary(summaryData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(`Error al cargar inventario: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id, tenantId]);

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !stockSearch.trim() ||
        item.name.toLowerCase().includes(stockSearch.trim().toLowerCase());

      const matchesStatus =
        stockStatusFilter === "all" ||
        (stockStatusFilter === "in_stock" && item.stock > 0) ||
        (stockStatusFilter === "out_of_stock" && item.stock <= 0);

      return matchesSearch && matchesStatus;
    });
  }, [items, stockSearch, stockStatusFilter]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      const matchesType =
        movementTypeFilter === "all" || mov.movementType === movementTypeFilter;

      const matchesIngredient =
        movementIngredientFilter === "all" ||
        mov.ingredientId === movementIngredientFilter;

      return matchesType && matchesIngredient;
    });
  }, [movements, movementTypeFilter, movementIngredientFilter]);

  // Stock Table Columns
  const stockColumns: Column<InventoryStockItem>[] = [
    {
      key: "name",
      header: "Ingrediente",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{row.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">Unidad base: {row.unit}</span>
            {row.wastePercentage > 0 && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                Merma: {row.wastePercentage}%
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Existencias Actuales",
      className: "text-right",
      render: (row) => {
        const isDepleted = row.stock <= 0;
        const isLow = !isDepleted && row.stock <= row.minStock;
        return (
          <div className="text-right space-y-0.5">
            <span
              className={cn(
                "font-mono font-bold text-sm",
                isDepleted
                  ? "text-rose-600 dark:text-rose-400"
                  : isLow
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {formatQty(row.stock)} {row.unit}
            </span>
            {isLow && (
              <div className="flex items-center justify-end gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="size-3" />
                <span>Bajo mín.</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "minStock",
      header: "Stock Mínimo",
      className: "text-right font-mono text-muted-foreground",
      render: (row) => (
        <span>
          {formatQty(row.minStock)} {row.unit}
        </span>
      ),
    },
    {
      key: "cost",
      header: "Coste Medio (PMP)",
      className: "text-right font-mono",
      render: (row) => (
        <span className="text-foreground">
          {row.cost > 0 ? formatCost(row.cost, row.unit) : "—"}
        </span>
      ),
    },
    {
      key: "totalValue",
      header: "Valor Estimado",
      className: "text-right font-mono font-bold",
      render: (row) => (
        <span className="text-foreground">{formatCurrency(row.totalValue)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      className: "text-center",
      render: (row) => {
        if (row.stock > 0) {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 gap-1 font-medium"
            >
              <CheckCircle2 className="size-3" />
              Disponible
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 gap-1 font-medium"
          >
            <XCircle className="size-3" />
            Agotado
          </Badge>
        );
      },
    },
  ];

  // Movements Table Columns
  const movementColumns: Column<StockMovementRecord>[] = [
    {
      key: "createdAt",
      header: "Fecha / Hora",
      className: "font-mono text-xs text-muted-foreground whitespace-nowrap",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "ingredientName",
      header: "Ingrediente",
      render: (row) => (
        <div className="font-medium text-foreground">
          {row.ingredientName}
        </div>
      ),
    },
    {
      key: "movementType",
      header: "Tipo de Operación",
      render: (row) => {
        switch (row.movementType) {
          case "PURCHASE_RECEIPT":
            return (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 gap-1"
              >
                <ShoppingCart className="size-3" />
                Recepción Compra
              </Badge>
            );
          case "PRODUCTION_CONSUMPTION":
            return (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 gap-1"
              >
                <UtensilsCrossed className="size-3" />
                Consumo Cocina
              </Badge>
            );
          case "MANUAL_ADJUSTMENT":
            return (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">
                Ajuste Manual
              </Badge>
            );
          case "WASTE_DISPOSAL":
            return (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-300">
                Merma / Desecho
              </Badge>
            );
          default:
            return <Badge variant="secondary">{row.movementType}</Badge>;
        }
      },
    },
    {
      key: "quantity",
      header: "Flujo / Cantidad",
      className: "text-right font-mono",
      render: (row) => {
        const isEntry = row.direction === "IN";
        return (
          <span
            className={cn(
              "inline-flex items-center font-bold text-sm",
              isEntry
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {isEntry ? (
              <ArrowDownLeft className="size-3.5 mr-0.5" />
            ) : (
              <ArrowUpRight className="size-3.5 mr-0.5" />
            )}
            {isEntry ? "+" : "−"}
            {formatQty(row.quantity)} {row.ingredientUnit}
          </span>
        );
      },
    },
    {
      key: "balance",
      header: "Evolución Balance",
      className: "text-right font-mono text-xs text-muted-foreground",
      render: (row) => (
        <span>
          {formatQty(row.previousStock)} →{" "}
          <strong className="text-foreground">{formatQty(row.newStock)}</strong>{" "}
          {row.ingredientUnit}
        </span>
      ),
    },
    {
      key: "unitCost",
      header: "Coste Registrado",
      className: "text-right font-mono text-xs",
      render: (row) => (
        <span className="text-foreground">
          {formatCost(row.unitCost, row.ingredientUnit)}
        </span>
      ),
    },
    {
      key: "reference",
      header: "Origen / Referencia",
      render: (row) => {
        const docLabel =
          row.referenceDocumentType === "PURCHASE_INVOICE"
            ? "Factura"
            : row.referenceDocumentType === "PRODUCTION_ORDER"
            ? "Orden Cocina"
            : row.referenceDocumentType;
        const shortId = row.referenceDocumentId.slice(0, 8);
        return (
          <div className="space-y-0.5 text-xs font-mono">
            <span className="text-foreground font-semibold">{docLabel}</span>
            <span className="text-muted-foreground block text-[11px]">
              ID: {shortId}...
            </span>
          </div>
        );
      },
    },
    {
      key: "notes",
      header: "Detalles / Trazabilidad",
      className: "text-xs text-muted-foreground",
      render: (row) => row.notes || "—",
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <SectionTitle
        overline="Existencias & Trazabilidad"
        title="Inventario & Kárdex"
        subtitle="Existencias en almacén, coste medio ponderado (PMP) y trazabilidad completa de entradas y salidas."
        trailing={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Link to="/admin/purchasing">
              <Button size="sm" className="gap-2">
                <ShoppingCart className="size-4" />
                Registrar Compras
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        }
      />
      <AdminHeader
        goal="Supervisar existencias, coste medio y trazabilidad de movimientos"
        capability="inventory.operate"
        object="Ingredient"
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingredientes Totales"
          value={loading ? "..." : String(summary?.totalIngredients ?? 0)}
          hint="Catálogo activo registrado"
        />
        <KpiCard
          label="Con Existencias"
          value={loading ? "..." : String(summary?.inStockCount ?? 0)}
          hint="Disponibles para cocina"
          trend="up"
        />
        <KpiCard
          label="Agotados / Sin Stock"
          value={loading ? "..." : String(summary?.outOfStockCount ?? 0)}
          hint={summary?.outOfStockCount ? "Requieren reposición" : "Stock cubierto"}
          trend={summary?.outOfStockCount ? "down" : "flat"}
        />
        <KpiCard
          label="Valor Total Almacén"
          value={loading ? "..." : formatCurrency(summary?.totalValuation ?? 0)}
          hint="A coste medio ponderado (WAC)"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="stock" className="gap-2 font-bold px-4">
            <Package className="size-4" />
            Existencias en Almacén
            <Badge variant="secondary" className="ml-1 text-[11px] py-0 px-1.5">
              {filteredItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 font-bold px-4">
            <Layers className="size-4" />
            Historial de Movimientos (Kárdex)
            <Badge variant="secondary" className="ml-1 text-[11px] py-0 px-1.5">
              {filteredMovements.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Existencias */}
        <TabsContent value="stock" className="space-y-4">
          <PanelCard>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Tabla de Existencias y Costes WAC
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Listado actualizado de ingredientes con balance físico y valoración a precio medio ponderado.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ingrediente..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <Select
                  value={stockStatusFilter}
                  onValueChange={(val) =>
                    setStockStatusFilter(val as "all" | "in_stock" | "out_of_stock")
                  }
                >
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Estado stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos ({items.length})</SelectItem>
                    <SelectItem value="in_stock">
                      Con Stock ({items.filter((i) => i.stock > 0).length})
                    </SelectItem>
                    <SelectItem value="out_of_stock">
                      Agotados ({items.filter((i) => i.stock <= 0).length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <DataTable
                columns={stockColumns}
                rows={filteredItems}
                empty={
                  <div className="text-center py-8 space-y-2">
                    <Boxes className="size-8 mx-auto text-muted-foreground/60" />
                    <p className="font-semibold text-foreground">
                      No se encontraron ingredientes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stockSearch
                        ? "Prueba a cambiar los términos de búsqueda o filtros."
                        : "Añade ingredientes en el catálogo o registra recepciones de compra."}
                    </p>
                  </div>
                }
              />
            </div>
          </PanelCard>
        </TabsContent>

        {/* TAB 2: Movimientos Kárdex */}
        <TabsContent value="movements" className="space-y-4">
          <PanelCard>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Kárdex de Movimientos Inmutables
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auditoría cronológica de cada entrada por recepción y salida por consumo de cocina.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <Select
                  value={movementTypeFilter}
                  onValueChange={setMovementTypeFilter}
                >
                  <SelectTrigger className="w-44 h-9 text-xs">
                    <SelectValue placeholder="Tipo operación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las operaciones</SelectItem>
                    <SelectItem value="PURCHASE_RECEIPT">
                      Recepciones de Compra
                    </SelectItem>
                    <SelectItem value="PRODUCTION_CONSUMPTION">
                      Consumos de Cocina
                    </SelectItem>
                    <SelectItem value="MANUAL_ADJUSTMENT">
                      Ajustes Manuales
                    </SelectItem>
                    <SelectItem value="WASTE_DISPOSAL">
                      Mermas / Desechos
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={movementIngredientFilter}
                  onValueChange={setMovementIngredientFilter}
                >
                  <SelectTrigger className="w-52 h-9 text-xs">
                    <SelectValue placeholder="Filtrar ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los ingredientes</SelectItem>
                    {items.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <DataTable
                columns={movementColumns}
                rows={filteredMovements}
                empty={
                  <div className="text-center py-8 space-y-2">
                    <Layers className="size-8 mx-auto text-muted-foreground/60" />
                    <p className="font-semibold text-foreground">
                      No hay movimientos registrados
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Los movimientos se generan automáticamente al procesar
                      recepciones de compras o consumos de producción.
                    </p>
                  </div>
                }
              />
            </div>
          </PanelCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
