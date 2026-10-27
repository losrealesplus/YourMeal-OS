/**
 * ADMIN · Operational Inventory & Movement Ledger (Kárdex)
 * Capability: inventory.operate
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { InventoryService } from "@/modules/inventory/application/inventory-service";
import type {
  InventoryStockItem,
  StockMovementRecord,
  InventorySummary,
  PaginatedStockMovements,
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

  // Active request and tenant tracking to prevent cross-tenant stale responses
  const activeTenantRef = useRef<string | null>(null);
  const activeReqRef = useRef<number>(0);

  // Stock state
  const [items, setItems] = useState<InventoryStockItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);

  // Kárdex state
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [movementsPagination, setMovementsPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
    hasMore: false,
  });
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("stock");

  // Stock filters (client-side search & status on fully loaded catalog)
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Movement server-side filters
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");
  const [movementIngredientFilter, setMovementIngredientFilter] = useState<string>("all");
  const [movementDateFrom, setMovementDateFrom] = useState<string>("");
  const [movementDateTo, setMovementDateTo] = useState<string>("");
  const [movementPage, setMovementPage] = useState<number>(1);
  const [movementPageSize, setMovementPageSize] = useState<number>(50);

  // Load complete stock catalog & compute consistent KPIs
  const loadStock = useCallback(
    async (reqId: number, targetTenantId: string) => {
      if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) return;

      setStockLoading(true);
      setStockError(null);

      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user!.id,
          tenantId: targetTenantId,
          roles,
        });

        const stockData = await InventoryService.getInventoryStock(ctx);

        // Guard against stale response if tenant switched or new request started
        if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) {
          return;
        }

        // Single source of truth: compute KPIs directly from the full fetched catalog
        const summaryData = InventoryService.computeInventorySummary(stockData);

        setItems(stockData);
        setSummary(summaryData);
        setStockError(null);
      } catch (err) {
        if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) {
          return;
        }
        // Fail closed: clear items and summary so old numbers are NEVER displayed on failure
        setItems([]);
        setSummary(null);
        const msg = err instanceof Error ? err.message : String(err);
        setStockError(msg);
        toast.error(`Error al cargar existencias: ${msg}`);
      } finally {
        if (activeReqRef.current === reqId && activeTenantRef.current === targetTenantId) {
          setStockLoading(false);
        }
      }
    },
    [user, roles],
  );

  // Load Kárdex movements with server-side filtering, stable ordering and pagination
  const loadMovements = useCallback(
    async (
      reqId: number,
      targetTenantId: string,
      page: number,
      pageSize: number,
      ingId: string,
      movType: string,
      dFrom: string,
      dTo: string,
    ) => {
      if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) return;

      setMovementsLoading(true);
      setMovementsError(null);

      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user!.id,
          tenantId: targetTenantId,
          roles,
        });

        const result: PaginatedStockMovements = await InventoryService.getStockMovements(ctx, {
          page,
          pageSize,
          ingredientId: ingId !== "all" ? ingId : undefined,
          movementType: movType !== "all" ? movType : undefined,
          dateFrom: dFrom || undefined,
          dateTo: dTo || undefined,
        });

        // Guard against stale response
        if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) {
          return;
        }

        setMovements(result.items);
        setMovementsPagination({
          totalCount: result.totalCount,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        });
        setMovementsError(null);
      } catch (err) {
        if (activeReqRef.current !== reqId || activeTenantRef.current !== targetTenantId) {
          return;
        }
        setMovements([]);
        setMovementsPagination({
          totalCount: 0,
          page: 1,
          pageSize,
          totalPages: 1,
          hasMore: false,
        });
        const msg = err instanceof Error ? err.message : String(err);
        setMovementsError(msg);
        toast.error(`Error al cargar movimientos: ${msg}`);
      } finally {
        if (activeReqRef.current === reqId && activeTenantRef.current === targetTenantId) {
          setMovementsLoading(false);
        }
      }
    },
    [user, roles],
  );

  // Tenant switch isolation: wipe state immediately and initiate fresh fetch
  useEffect(() => {
    const reqId = ++activeReqRef.current;
    activeTenantRef.current = tenantId ?? null;

    // P1: Immediately clear previous tenant's data, errors and state
    setItems([]);
    setSummary(null);
    setStockError(null);
    setStockLoading(true);

    setMovements([]);
    setMovementsPagination({
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      hasMore: false,
    });
    setMovementsError(null);
    setMovementsLoading(false);

    // Reset filters
    setStockSearch("");
    setStockStatusFilter("all");
    setMovementIngredientFilter("all");
    setMovementTypeFilter("all");
    setMovementDateFrom("");
    setMovementDateTo("");
    setMovementPage(1);

    if (!user || !tenantId) {
      setStockLoading(false);
      return;
    }

    loadStock(reqId, tenantId);
    loadMovements(reqId, tenantId, 1, movementPageSize, "all", "all", "", "");
  }, [user?.id, tenantId, loadStock, loadMovements, movementPageSize]);

  // Handler for manual refresh
  const handleManualRefresh = () => {
    if (!user || !tenantId) return;
    const reqId = ++activeReqRef.current;
    loadStock(reqId, tenantId);
    loadMovements(
      reqId,
      tenantId,
      movementPage,
      movementPageSize,
      movementIngredientFilter,
      movementTypeFilter,
      movementDateFrom,
      movementDateTo,
    );
  };

  // Handler for Kárdex filter updates
  const handleFilterChange = (
    nextType: string,
    nextIng: string,
    nextFrom: string,
    nextTo: string,
    nextPage: number = 1,
    nextSize: number = movementPageSize,
  ) => {
    setMovementTypeFilter(nextType);
    setMovementIngredientFilter(nextIng);
    setMovementDateFrom(nextFrom);
    setMovementDateTo(nextTo);
    setMovementPage(nextPage);
    setMovementPageSize(nextSize);

    if (!user || !tenantId) return;
    const reqId = ++activeReqRef.current;
    loadMovements(reqId, tenantId, nextPage, nextSize, nextIng, nextType, nextFrom, nextTo);
  };

  const handleClearKardexFilters = () => {
    handleFilterChange("all", "all", "", "", 1, movementPageSize);
  };

  const isKardexFiltered =
    movementTypeFilter !== "all" ||
    movementIngredientFilter !== "all" ||
    Boolean(movementDateFrom) ||
    Boolean(movementDateTo);

  // Handler for tab switching
  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    if (nextTab === "movements" && user && tenantId) {
      const reqId = ++activeReqRef.current;
      loadMovements(
        reqId,
        tenantId,
        movementPage,
        movementPageSize,
        movementIngredientFilter,
        movementTypeFilter,
        movementDateFrom,
        movementDateTo,
      );
    }
  };

  // Filtered Stock Items (client-side search & availability on complete catalog)
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
            {row.minStock > 0 && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Mínimo: {formatQty(row.minStock)} {row.unit}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "cost",
      header: "Coste Medio (PMP)",
      className: "text-right",
      render: (row) => (
        <div className="text-right space-y-0.5">
          <span className="font-mono font-semibold text-foreground">
            {formatCost(row.cost, row.unit)}
          </span>
          <p className="text-[10px] text-muted-foreground">WAC computable</p>
        </div>
      ),
    },
    {
      key: "totalValue",
      header: "Valor Estimado",
      className: "text-right",
      render: (row) => (
        <div className="text-right">
          <span className="font-mono font-bold text-foreground">
            {formatCurrency(row.totalValue)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Disponibilidad",
      className: "text-center",
      render: (row) => {
        if (row.stock <= 0) {
          return (
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-xs font-semibold gap-1"
            >
              <XCircle className="size-3" />
              Agotado
            </Badge>
          );
        }
        if (row.stock <= row.minStock) {
          return (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs font-semibold gap-1"
            >
              <AlertTriangle className="size-3" />
              Bajo Mínimo
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-semibold gap-1"
          >
            <CheckCircle2 className="size-3" />
            Disponible
          </Badge>
        );
      },
    },
  ];

  // Kárdex Movement Columns
  const movementColumns: Column<StockMovementRecord>[] = [
    {
      key: "createdAt",
      header: "Fecha / Hora",
      className: "w-44",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "ingredientName",
      header: "Ingrediente",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{row.ingredientName}</p>
          <span className="text-[11px] text-muted-foreground font-mono">
            {row.ingredientUnit}
          </span>
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
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 gap-1 text-xs"
              >
                <ShoppingCart className="size-3" />
                Recepción Compra
              </Badge>
            );
          case "PRODUCTION_CONSUMPTION":
            return (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 gap-1 text-xs"
              >
                <UtensilsCrossed className="size-3" />
                Consumo Cocina
              </Badge>
            );
          case "MANUAL_ADJUSTMENT":
            return (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300 text-xs">
                Ajuste Manual
              </Badge>
            );
          case "WASTE_DISPOSAL":
            return (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-300 text-xs">
                Merma / Desecho
              </Badge>
            );
          default:
            return <Badge variant="secondary" className="text-xs">{row.movementType}</Badge>;
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
      key: "newStock",
      header: "Saldo Almacén",
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
          {row.unitCost > 0 ? formatCost(row.unitCost, row.ingredientUnit) : "—"}
        </span>
      ),
    },
    {
      key: "referenceDocumentId",
      header: "Documento Origen",
      render: (row) => {
        const docLabel =
          row.referenceDocumentType === "PURCHASE_INVOICE"
            ? "Factura"
            : row.referenceDocumentType === "PRODUCTION_ORDER"
            ? "Orden Cocina"
            : row.referenceDocumentType;
        const shortId = (row.referenceDocumentId || "").slice(0, 8);
        return (
          <div className="space-y-0.5 text-xs font-mono">
            <span className="text-foreground font-semibold">{docLabel}</span>
            {shortId && (
              <span className="text-muted-foreground block text-[11px]">
                ID: {shortId}...
              </span>
            )}
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

  const kardexStartRow =
    movementsPagination.totalCount === 0
      ? 0
      : (movementsPagination.page - 1) * movementsPagination.pageSize + 1;
  const kardexEndRow = Math.min(
    movementsPagination.page * movementsPagination.pageSize,
    movementsPagination.totalCount,
  );

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
              onClick={handleManualRefresh}
              disabled={stockLoading || movementsLoading}
              className="gap-2"
            >
              <RefreshCw
                className={cn("size-4", (stockLoading || movementsLoading) && "animate-spin")}
              />
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

      {/* KPI Overview Summary — computed strictly from complete stock catalog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingredientes Totales"
          value={stockLoading ? "..." : String(summary?.totalIngredients ?? 0)}
          hint="Catálogo activo registrado"
        />
        <KpiCard
          label="Con Existencias"
          value={stockLoading ? "..." : String(summary?.inStockCount ?? 0)}
          hint="Disponibles para cocina"
          trend="up"
        />
        <KpiCard
          label="Agotados / Sin Stock"
          value={stockLoading ? "..." : String(summary?.outOfStockCount ?? 0)}
          hint={summary?.outOfStockCount ? "Requieren reposición" : "Stock cubierto"}
          trend={summary?.outOfStockCount ? "down" : "flat"}
        />
        <KpiCard
          label="Valor Total Almacén"
          value={stockLoading ? "..." : formatCurrency(summary?.totalValuation ?? 0)}
          hint="A coste medio ponderado (WAC)"
        />
      </div>

      {/* Error Banners */}
      {stockError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{stockError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            Reintentar
          </Button>
        </div>
      )}

      {movementsError && activeTab === "movements" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{movementsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleFilterChange(
                movementTypeFilter,
                movementIngredientFilter,
                movementDateFrom,
                movementDateTo,
                movementPage,
                movementPageSize,
              )
            }
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
              {movementsPagination.totalCount}
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

        {/* TAB 2: Movimientos Kárdex con Filtrado en Servidor y Paginación */}
        <TabsContent value="movements" className="space-y-4">
          <PanelCard>
            <div className="flex flex-col gap-4 pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Kárdex de Movimientos Inmutables
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auditoría cronológica de cada entrada por recepción y salida por consumo de cocina filtrada directamente en PostgreSQL.
                  </p>
                </div>

                {isKardexFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearKardexFilters}
                    className="text-xs text-muted-foreground gap-1.5 h-8"
                  >
                    <RotateCcw className="size-3.5" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {/* Server-side Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {/* Movement Type Filter */}
                <Select
                  value={movementTypeFilter}
                  onValueChange={(val) =>
                    handleFilterChange(
                      val,
                      movementIngredientFilter,
                      movementDateFrom,
                      movementDateTo,
                      1,
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
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

                {/* Ingredient Filter */}
                <Select
                  value={movementIngredientFilter}
                  onValueChange={(val) =>
                    handleFilterChange(
                      movementTypeFilter,
                      val,
                      movementDateFrom,
                      movementDateTo,
                      1,
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
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

                {/* Date From */}
                <div className="relative">
                  <Input
                    type="date"
                    value={movementDateFrom}
                    onChange={(e) =>
                      handleFilterChange(
                        movementTypeFilter,
                        movementIngredientFilter,
                        e.target.value,
                        movementDateTo,
                        1,
                      )
                    }
                    className="h-9 text-xs"
                    title="Fecha desde"
                  />
                </div>

                {/* Date To */}
                <div className="relative">
                  <Input
                    type="date"
                    value={movementDateTo}
                    onChange={(e) =>
                      handleFilterChange(
                        movementTypeFilter,
                        movementIngredientFilter,
                        movementDateFrom,
                        e.target.value,
                        1,
                      )
                    }
                    className="h-9 text-xs"
                    title="Fecha hasta"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="pt-2">
              <DataTable
                columns={movementColumns}
                rows={movements}
                empty={
                  <div className="text-center py-8 space-y-2">
                    <Layers className="size-8 mx-auto text-muted-foreground/60" />
                    <p className="font-semibold text-foreground">
                      {isKardexFiltered
                        ? "No se encontraron movimientos con los filtros aplicados"
                        : "No hay movimientos registrados"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isKardexFiltered
                        ? "Prueba a cambiar o limpiar los filtros seleccionados."
                        : "Los movimientos se generan automáticamente al procesar recepciones de compras o consumos de producción."}
                    </p>
                    {isKardexFiltered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearKardexFilters}
                        className="mt-2 text-xs"
                      >
                        Restablecer filtros
                      </Button>
                    )}
                  </div>
                }
              />
            </div>

            {/* Pagination Controls */}
            {movementsPagination.totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
                <div>
                  Mostrando del{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {kardexStartRow}
                  </span>{" "}
                  al{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {kardexEndRow}
                  </span>{" "}
                  de{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {movementsPagination.totalCount}
                  </span>{" "}
                  movimientos
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span>Filas por pág:</span>
                    <Select
                      value={String(movementsPagination.pageSize)}
                      onValueChange={(val) =>
                        handleFilterChange(
                          movementTypeFilter,
                          movementIngredientFilter,
                          movementDateFrom,
                          movementDateTo,
                          1,
                          Number(val),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    Página {movementsPagination.page} de {movementsPagination.totalPages}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={movementsPagination.page <= 1 || movementsLoading}
                      onClick={() =>
                        handleFilterChange(
                          movementTypeFilter,
                          movementIngredientFilter,
                          movementDateFrom,
                          movementDateTo,
                          movementsPagination.page - 1,
                          movementsPagination.pageSize,
                        )
                      }
                      className="h-8 w-8 p-0"
                      title="Página anterior"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!movementsPagination.hasMore || movementsLoading}
                      onClick={() =>
                        handleFilterChange(
                          movementTypeFilter,
                          movementIngredientFilter,
                          movementDateFrom,
                          movementDateTo,
                          movementsPagination.page + 1,
                          movementsPagination.pageSize,
                        )
                      }
                      className="h-8 w-8 p-0"
                      title="Página siguiente"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </PanelCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
