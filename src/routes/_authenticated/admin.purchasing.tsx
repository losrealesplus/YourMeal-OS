/**
 * ADMIN · Purchasing & Procurement Cost Management (CR-COST-01 / CR-COST-04)
 * Capability: purchasing.operate / inventory.operate
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  DollarSign,
  Package,
  Layers,
  Building2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { ProcurementCostService } from "@/modules/cost-intelligence/application/procurement-cost-service";
import { InventoryCostSyncService } from "@/modules/cost-intelligence/application/inventory-cost-sync-service";
import type {
  CalculatedPurchaseInvoice,
} from "@/modules/cost-intelligence/domain/procurement-types";
import type { ProrationMethod } from "@/modules/cost-intelligence/domain/types";
import { AdminHeader, DataTable, PanelCard, SectionTitle, StatusChip } from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/purchasing")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "inventory.operate");
  },
  component: AdminPurchasingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Compras & Facturas de Proveedores" },
      {
        name: "description",
        content: "Gestión de compras, recepción de facturas y sincronización de escandallos WAC.",
      },
    ],
  }),
});

type SupplierOption = {
  id: string;
  name: string;
};

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  cost: number;
  stock: number;
};

type FormLineItem = {
  itemId: string;
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
};

const emptyLineItem: FormLineItem = {
  itemId: "",
  itemName: "",
  quantity: "1",
  unit: "kg",
  unitPrice: "0.00",
  discountAmount: "0.00",
  taxRate: "10",
};

export function AdminPurchasingPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [invoices, setInvoices] = useState<CalculatedPurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "received">("all");

  // Create Invoice Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("0.00");
  const [allocationMethod, setAllocationMethod] = useState<ProrationMethod>("value");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { ...emptyLineItem },
  ]);

  // View Invoice Detail Dialog
  const [selectedInvoice, setSelectedInvoice] = useState<CalculatedPurchaseInvoice | null>(null);

  async function reload() {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const procurementService = new ProcurementCostService();
      const [invList, suppRes, ingRes] = await Promise.all([
        procurementService.listInvoices(ctx).catch(() => []),
        supabase.from("suppliers").select("id, name").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("ingredients").select("id, name, unit, cost, stock").eq("tenant_id", tenantId).is("deleted_at", null),
      ]);

      setInvoices(invList);
      setSuppliers((suppRes.data as SupplierOption[]) || []);
      setIngredients((ingRes.data as IngredientOption[]) || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  // Line item helpers
  const addLine = () => {
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const removeLine = (idx: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<FormLineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...patch };
        if (patch.itemId) {
          const ing = ingredients.find((ing) => ing.id === patch.itemId);
          if (ing) {
            updated.itemName = ing.name;
            updated.unit = ing.unit || "kg";
            if (Number(updated.unitPrice) <= 0) {
              updated.unitPrice = String(ing.cost || 0);
            }
          }
        }
        return updated;
      }),
    );
  };

  // Preview calculations
  const previewTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    lineItems.forEach((l) => {
      const q = Math.max(0, Number(l.quantity) || 0);
      const p = Math.max(0, Number(l.unitPrice) || 0);
      const d = Math.max(0, Number(l.discountAmount) || 0);
      const t = Math.max(0, Number(l.taxRate) || 0);
      const base = Math.max(0, q * p - d);
      const tax = (base * t) / 100;
      subtotal += base;
      taxAmount += tax;
    });
    const extra = Math.max(0, Number(additionalCosts) || 0);
    const total = subtotal + taxAmount + extra;
    return { subtotal, taxAmount, additionalCosts: extra, total };
  }, [lineItems, additionalCosts]);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId) return;

    if (!invoiceNumber.trim()) {
      toast.error("El número de factura es obligatorio.");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("Selecciona un proveedor.");
      return;
    }

    const items = lineItems.map((l) => {
      const itemId = l.itemId || `item-custom-${Date.now()}`;
      const itemName = l.itemName || "Ingrediente de Compra";
      return {
        itemId,
        itemName,
        quantity: Number(l.quantity) || 1,
        unit: l.unit || "kg",
        unitPrice: Number(l.unitPrice) || 0,
        discountAmount: Number(l.discountAmount) || 0,
        taxRate: Number(l.taxRate) || 10,
      };
    });

    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const procurementService = new ProcurementCostService();
      await procurementService.createDraftInvoice(ctx, {
        tenantId,
        supplierId: selectedSupplierId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        items,
        additionalCosts: Number(additionalCosts) || 0,
        allocationMethod,
        notes: notes.trim() || undefined,
      });

      toast.success(`Factura ${invoiceNumber} registrada como borrador.`);
      setIsCreateOpen(false);
      setInvoiceNumber("");
      setLineItems([{ ...emptyLineItem }]);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReceiveInvoice(invoice: CalculatedPurchaseInvoice) {
    if (!user || !tenantId) return;
    if (invoice.status === "received") return;

    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const procurementService = new ProcurementCostService();
      const syncService = new InventoryCostSyncService();

      // 1. Mark received & record immutable cost history
      await procurementService.receiveInvoice(ctx, invoice.id);

      // 2. Synchronously recalculate WAC for each purchased line item
      for (const item of invoice.items) {
        const ing = ingredients.find((i) => i.id === item.itemId);
        const currentStock = ing?.stock ?? 0;
        const currentCost = ing?.cost ?? item.effectiveUnitCost;

        await syncService.syncDerivedItemCostWAC(ctx, {
          itemId: item.itemId,
          currentStock,
          currentCost,
          inboundQuantity: item.quantity,
          inboundEffectiveCost: item.effectiveUnitCost,
        });
      }

      toast.success(
        `Factura ${invoice.invoiceNumber} procesada. Costes medios (WAC) actualizados.`,
      );
      setSelectedInvoice(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    if (activeTab === "draft") return invoices.filter((i) => i.status === "draft");
    if (activeTab === "received") return invoices.filter((i) => i.status === "received");
    return invoices;
  }, [invoices, activeTab]);

  const columns: Column<CalculatedPurchaseInvoice>[] = [
    {
      key: "invoiceNumber",
      header: "Nº Factura / Fecha",
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-sm">{r.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{r.invoiceDate}</p>
        </div>
      ),
    },
    {
      key: "supplierId",
      header: "Proveedor",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">
            {supplierMap.get(r.supplierId) || r.supplierId}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Líneas",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.items.length} {r.items.length === 1 ? "artículo" : "artículos"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Factura",
      render: (r) => (
        <div className="text-right tabular-nums">
          <p className="font-bold text-sm">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
              r.totalAmount,
            )}
          </p>
          {r.additionalCosts > 0 && (
            <p className="text-[10px] text-muted-foreground">
              +{Number(r.additionalCosts).toFixed(2)}€ flete
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <StatusChip
          tone={r.status === "received" ? "positive" : r.status === "draft" ? "neutral" : "warning"}
          label={r.status === "received" ? "Procesada / WAC" : r.status}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setSelectedInvoice(r)}
          >
            Ver Detalle
          </Button>
          {r.status === "draft" && (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              disabled={busy}
              onClick={() => handleReceiveInvoice(r)}
            >
              <CheckCircle2 className="h-3 w-3" />
              Procesar WAC
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <SectionTitle
        overline="Aprovisionamiento & Escandallo"
        title="Gestión de Compras y Facturas"
        subtitle="Entrada de albaranes y facturas de proveedores con imputación de costes y recálculo WAC."
      />
      <AdminHeader
        goal="Controlar compras e imputar costes de adquisición al stock"
        capability="inventory.operate / purchasing.operate"
        object="PurchaseInvoice"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <PanelCard className="p-4 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Facturas
          </div>
          <div className="text-2xl font-bold mt-1">{invoices.length}</div>
        </PanelCard>
        <PanelCard className="p-4 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Facturas Procesadas
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {invoices.filter((i) => i.status === "received").length}
          </div>
        </PanelCard>
        <PanelCard className="p-4 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pendientes (Borrador)
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {invoices.filter((i) => i.status === "draft").length}
          </div>
        </PanelCard>
        <PanelCard className="p-4 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Volumen Total Compras
          </div>
          <div className="text-2xl font-bold mt-1">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
              invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0),
            )}
          </div>
        </PanelCard>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === "received"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Procesadas ({invoices.filter((i) => i.status === "received").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === "draft"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Borradores ({invoices.filter((i) => i.status === "draft").length})
          </button>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nueva Factura de Compra
        </Button>
      </div>

      {/* Invoices List Table */}
      <PanelCard>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando facturas de compra…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredInvoices}
            empty="No hay facturas de compra registradas en este estado."
          />
        )}
      </PanelCard>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Registrar Factura de Compra
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registra la factura del proveedor con sus líneas de compra y costes adicionales de transporte/aduanas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="inv-num">Nº Factura *</Label>
                <Input
                  id="inv-num"
                  required
                  placeholder="ej. FAC-2026-0901"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-date">Fecha Factura *</Label>
                <Input
                  id="inv-date"
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                {suppliers.length > 0 ? (
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="ID / Nombre proveedor"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="extra-costs">Costes adicionales / Fletes (€)</Label>
                <Input
                  id="extra-costs"
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCosts}
                  onChange={(e) => setAdditionalCosts(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Método de Asignación de Costes</Label>
                <Select
                  value={allocationMethod}
                  onValueChange={(v) => setAllocationMethod(v as ProrationMethod)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Proporcional al Valor (€)</SelectItem>
                    <SelectItem value="units">Proporcional a Unidades</SelectItem>
                    <SelectItem value="weight">Proporcional al Peso (kg)</SelectItem>
                    <SelectItem value="volume">Proporcional al Volumen (m³)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-sm">Líneas de Compra (Artículos)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine} className="h-7 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Añadir Línea
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lineItems.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border text-xs"
                  >
                    <div className="col-span-4 space-y-1">
                      {ingredients.length > 0 ? (
                        <Select
                          value={line.itemId}
                          onValueChange={(val) => updateLine(idx, { itemId: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar ingrediente" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Nombre artículo"
                          className="h-8 text-xs"
                          value={line.itemName}
                          onChange={(e) => updateLine(idx, { itemName: e.target.value })}
                        />
                      )}
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Input
                        type="number"
                        placeholder="Cant."
                        className="h-8 text-xs"
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Input
                        type="number"
                        placeholder="Precio €"
                        className="h-8 text-xs"
                        min="0"
                        step="0.0001"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Input
                        type="number"
                        placeholder="Dto €"
                        className="h-8 text-xs"
                        min="0"
                        step="0.01"
                        value={line.discountAmount}
                        onChange={(e) => updateLine(idx, { discountAmount: e.target.value })}
                      />
                    </div>

                    <div className="col-span-1 space-y-1">
                      <Input
                        type="number"
                        placeholder="IVA %"
                        className="h-8 text-xs"
                        min="0"
                        step="1"
                        value={line.taxRate}
                        onChange={(e) => updateLine(idx, { taxRate: e.target.value })}
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(idx)}
                        disabled={lineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary Footer */}
            <div className="bg-muted/40 p-3 rounded-lg flex justify-between items-center text-xs border">
              <div>
                <span>Subtotal: {previewTotals.subtotal.toFixed(2)} €</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span>IVA: {previewTotals.taxAmount.toFixed(2)} €</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span>Fletes: {previewTotals.additionalCosts.toFixed(2)} €</span>
              </div>
              <div className="text-sm font-bold text-primary">
                Total: {previewTotals.total.toFixed(2)} €
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                Crear Factura Borrador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={Boolean(selectedInvoice)} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalle de Factura: {selectedInvoice.invoiceNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Fecha: {selectedInvoice.invoiceDate} · Proveedor:{" "}
                {supplierMap.get(selectedInvoice.supplierId) || selectedInvoice.supplierId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-3 gap-2 bg-muted/20 p-3 rounded border">
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <div className="font-semibold mt-0.5">{selectedInvoice.status}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Método Asignación:</span>
                  <div className="font-semibold mt-0.5">{selectedInvoice.allocationMethod}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-bold text-sm text-primary mt-0.5">
                    {Number(selectedInvoice.totalAmount).toFixed(2)} €
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Líneas con Coste de Adquisición Prorrateado:</h4>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 bg-background border rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{it.itemName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {it.quantity} {it.unit} @ {Number(it.unitPrice).toFixed(4)} €/u
                          {it.allocatedOverhead > 0 && ` (+${it.allocatedOverhead.toFixed(2)} € flete)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{Number(it.lineTotal).toFixed(2)} €</p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          WAC unitario: {Number(it.effectiveUnitCost).toFixed(4)} €/{it.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Cerrar
              </Button>
              {selectedInvoice.status === "draft" && (
                <Button
                  disabled={busy}
                  onClick={() => handleReceiveInvoice(selectedInvoice)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Procesar Factura y Recalcular WAC
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
