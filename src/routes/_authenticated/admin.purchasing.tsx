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
  Upload,
  AlertTriangle,
  FileWarning,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { ProcurementCostService } from "@/modules/cost-intelligence/application/procurement-cost-service";
import { isValidUuid } from "@/modules/cost-intelligence/domain/purchase-invoice-calculator";
import { extractPurchasingDraftFromDocument } from "@/modules/cost-intelligence/application/purchasing-document-draft";
import type {
  CalculatedPurchaseInvoice,
  ItemNature,
  ReceiptPreviewResult,
} from "@/modules/cost-intelligence/domain/procurement-types";
import type { ProrationMethod } from "@/modules/cost-intelligence/domain/types";
import { MarketBenchmarkBadge } from "@/modules/market-intelligence/presentation/components/MarketBenchmarkBadge";
import { useMarketIntelligence } from "@/modules/market-intelligence/presentation/hooks/use-market-intelligence";
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
  lineId: string;
  itemId: string;
  itemName: string;
  itemNature: ItemNature;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
};

function createInitialLineItem(nature: ItemNature = "INVENTORYABLE"): FormLineItem {
  const lineId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "";
  const itemId = nature === "EXPENSE_SERVICE" && typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "";
  return {
    lineId,
    itemId,
    itemName: "",
    itemNature: nature,
    quantity: "1",
    unit: nature === "EXPENSE_SERVICE" ? "ud" : "kg",
    unitPrice: "0.00",
    discountAmount: "0.00",
    taxRate: nature === "EXPENSE_SERVICE" ? "21" : "10",
  };
}

export function AdminPurchasingPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const { benchmarksByIngredient, mappings } = useMarketIntelligence(tenantId);
  const [invoices, setInvoices] = useState<CalculatedPurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "received">("all");

  // Atomic Physical Receipt Dialog State
  const [receiptPreview, setReceiptPreview] = useState<ReceiptPreviewResult | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  // Create Invoice Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftInvoiceId, setDraftInvoiceId] = useState<string>(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "",
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("0.00");
  const [allocationMethod, setAllocationMethod] = useState<ProrationMethod>("value");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    createInitialLineItem(),
  ]);

  // View Invoice Detail Dialog
  const [selectedInvoice, setSelectedInvoice] = useState<CalculatedPurchaseInvoice | null>(null);

  // Document Ingestion State (CR-COST-05 Bloque 1)
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [d010Notice, setD010Notice] = useState<string | null>(null);
  const [docSummary, setDocSummary] = useState<{
    fileName: string;
    checksum: string;
    validCount: number;
    quarantinedCount: number;
    quarantinedLines: Array<{ lineNumber: number; productName: string; reason: string }>;
  } | null>(null);

  async function handleProcessDocument(file: File) {
    if (!file) return;
    setIsProcessingDoc(true);
    setD010Notice(null);
    setDocSummary(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const extraction = await extractPurchasingDraftFromDocument({
        bufferOrText: bytes,
        fileName: file.name,
        mimeType: file.type,
        suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          cost: ing.cost,
          stock: ing.stock,
        })),
      });

      setDraftInvoiceId(
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : ""
      );

      if (extraction.invoiceNumber) {
        setInvoiceNumber(extraction.invoiceNumber);
      }
      if (extraction.invoiceDate) {
        setInvoiceDate(extraction.invoiceDate);
      }
      if (extraction.selectedSupplierId) {
        setSelectedSupplierId(extraction.selectedSupplierId);
      }
      if (extraction.additionalCosts && Number(extraction.additionalCosts) > 0) {
        setAdditionalCosts(extraction.additionalCosts);
      }
      if (extraction.notes) {
        setNotes(extraction.notes);
      }

      if (extraction.candidateLines.length > 0) {
        setLineItems(
          extraction.candidateLines.map((c) => ({
            lineId: c.lineId,
            itemId: c.itemId,
            itemName: c.itemName,
            itemNature: c.itemNature,
            quantity: c.quantity,
            unit: c.unit,
            unitPrice: c.unitPrice,
            discountAmount: c.discountAmount,
            taxRate: c.taxRate,
          }))
        );
      } else {
        setLineItems([createInitialLineItem()]);
      }

      if (extraction.d010Warning) {
        setD010Notice(extraction.d010Warning);
      }

      setDocSummary({
        fileName: extraction.fileName,
        checksum: extraction.fileChecksumSha256,
        validCount: extraction.validLinesCount,
        quarantinedCount: extraction.quarantinedLines.length,
        quarantinedLines: extraction.quarantinedLines.map((q) => ({
          lineNumber: q.lineNumber,
          productName: q.productName,
          reason: q.reason,
        })),
      });

      setIsUploadDocOpen(false);
      setIsCreateOpen(true);

      if (extraction.validLinesCount > 0) {
        toast.success(
          `Documento procesado: ${extraction.validLinesCount} líneas extraídas.${
            extraction.matchedSupplierName ? ` Proveedor: ${extraction.matchedSupplierName}.` : ""
          }`
        );
      } else if (extraction.d010Warning) {
        toast.warning(extraction.d010Warning);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el documento");
    } finally {
      setIsProcessingDoc(false);
    }
  }

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
  const addLine = (nature: ItemNature = "INVENTORYABLE") => {
    setLineItems((prev) => [...prev, createInitialLineItem(nature)]);
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

    if (!lineItems || lineItems.length === 0) {
      toast.error("La factura debe tener al menos una línea.");
      return;
    }

    // Explicit validation: Do not invent missing IDs or silently normalize invalid values
    for (let i = 0; i < lineItems.length; i++) {
      const line = lineItems[i];
      const isService = line.itemNature === "EXPENSE_SERVICE";
      if (!isService) {
        if (!line.itemId || !isValidUuid(line.itemId)) {
          toast.error(`La línea ${i + 1} (${line.itemName || "Ingrediente"}) requiere un ingrediente válido.`);
          return;
        }
      } else {
        if (!line.itemName || !line.itemName.trim()) {
          toast.error(`La línea de servicio ${i + 1} requiere un concepto o descripción.`);
          return;
        }
      }

      const q = Number(line.quantity);
      if (isNaN(q) || q <= 0) {
        toast.error(`La línea ${i + 1} debe tener una cantidad mayor que cero.`);
        return;
      }

      const p = Number(line.unitPrice);
      if (isNaN(p) || p < 0) {
        toast.error(`La línea ${i + 1} no puede tener un precio unitario negativo.`);
        return;
      }

      const d = Number(line.discountAmount);
      if (isNaN(d) || d < 0) {
        toast.error(`La línea ${i + 1} no puede tener un descuento negativo.`);
        return;
      }

      const parsedTax = Number(line.taxRate);
      if (isNaN(parsedTax) || parsedTax < 0) {
        toast.error(`La línea ${i + 1} no puede tener un IVA negativo.`);
        return;
      }
    }

    const currentDraftId = draftInvoiceId || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined);

    const items = lineItems.map((l) => {
      const isService = l.itemNature === "EXPENSE_SERVICE";
      const parsedTax = Number(l.taxRate);
      const taxRate = isNaN(parsedTax) ? (isService ? 21 : 10) : Math.max(0, parsedTax);
      const lineId = l.lineId || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined);
      const itemId = isService
        ? (l.itemId && isValidUuid(l.itemId) ? l.itemId : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : ""))
        : l.itemId;
      const itemName = l.itemName || (isService ? "Servicio / Gasto Operativo" : "Ingrediente de Compra");
      return {
        id: lineId,
        itemId,
        itemName,
        itemNature: l.itemNature || "INVENTORYABLE",
        quantity: Number(l.quantity),
        unit: l.unit || (isService ? "ud" : "kg"),
        unitPrice: Number(l.unitPrice),
        discountAmount: Math.max(0, Number(l.discountAmount) || 0),
        taxRate,
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
        id: currentDraftId,
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
      setDraftInvoiceId(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "");
      setLineItems([createInitialLineItem()]);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenReceiveConfirmation(invoice: CalculatedPurchaseInvoice) {
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
      const preview = await procurementService.previewInvoiceReception(ctx, invoice.id);
      setReceiptPreview(preview);
      setIsReceiptDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmAtomicReceipt() {
    if (!user || !tenantId || !receiptPreview) return;

    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const procurementService = new ProcurementCostService();
      const result = await procurementService.receiveInvoice(ctx, receiptPreview.invoiceId);

      if (result.idempotent) {
        toast.info(
          `Factura ${receiptPreview.invoiceNumber} ya estaba procesada (ejecución idempotente).`,
        );
      } else {
        toast.success(
          `Recepción confirmada: ${result.summary.totalStockIncrement} uds añadidas a existencias y WAC actualizado atómicamente.`,
        );
      }

      setIsReceiptDialogOpen(false);
      setReceiptPreview(null);
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
          {(r.status === "draft" || r.status === "partially_received") && (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              disabled={busy}
              onClick={() => handleOpenReceiveConfirmation(r)}
            >
              <CheckCircle2 className="h-3 w-3" />
              Recepcionar
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsUploadDocOpen(true);
            }}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4 text-primary" />
            Cargar Factura desde Documento
          </Button>

          <Button
            onClick={() => {
              setDraftInvoiceId(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "");
              setLineItems([createInitialLineItem()]);
              setInvoiceNumber("");
              setSelectedSupplierId("");
              setAdditionalCosts("0.00");
              setNotes("");
              setD010Notice(null);
              setDocSummary(null);
              setIsCreateOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nueva Factura de Compra
          </Button>
        </div>
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
                Registra la factura del proveedor con sus líneas de compra y costes adicionales de transporte/aduanas en estado Borrador (DRAFT).
              </DialogDescription>
            </DialogHeader>

            {/* Quick File Assist Action */}
            <div className="flex items-center justify-between bg-muted/30 border rounded-lg p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  ¿Deseas precargar desde albarán o factura en PDF, foto o CSV?
                </span>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/png,image/jpeg,image/webp,.csv,.tsv,.txt"
                  disabled={isProcessingDoc}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessDocument(f);
                  }}
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors shadow-xs">
                  {isProcessingDoc ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" />
                      Precargar desde Archivo
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* D-010 Integrity Notice */}
            {d010Notice && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Control de Integridad D-010 (Anti-Alucinación)</p>
                  <p>{d010Notice}</p>
                </div>
              </div>
            )}

            {/* Document Extraction Summary */}
            {docSummary && (
              <div className="bg-muted/40 border rounded-lg p-2.5 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium truncate max-w-[200px]">{docSummary.fileName}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      SHA-256: {docSummary.checksum.slice(0, 10)}…
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {docSummary.validCount} líneas válidas
                    </Badge>
                    {docSummary.quarantinedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                        {docSummary.quarantinedCount} en cuarentena
                      </Badge>
                    )}
                  </div>
                </div>
                {docSummary.quarantinedCount > 0 && (
                  <div className="border-t pt-1.5 text-[11px] text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Líneas descartadas por filtro de calidad:
                    </p>
                    {docSummary.quarantinedLines.map((ql, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[260px]">• {ql.productName}</span>
                        <span className="text-amber-600 italic">{ql.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                <Label className="font-semibold text-sm">Líneas de Compra (Artículos & Servicios)</Label>
                <div className="flex items-center gap-1.5">
                  <Button type="button" size="sm" variant="outline" onClick={() => addLine("INVENTORYABLE")} className="h-7 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    + Ingrediente
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => addLine("EXPENSE_SERVICE")} className="h-7 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    + Servicio
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground px-2 pt-1">
                <div className="col-span-2">Tipo</div>
                <div className="col-span-3">Concepto</div>
                <div className="col-span-2">Cantidad</div>
                <div className="col-span-2">Precio (€)</div>
                <div className="col-span-1">Dto (€)</div>
                <div className="col-span-1">IVA %</div>
                <div className="col-span-1 text-right">Borrar</div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lineItems.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border text-xs"
                  >
                    <div className="col-span-2 space-y-1">
                      <Select
                        value={line.itemNature}
                        onValueChange={(val) => {
                          const nextNature = val as ItemNature;
                          const nextItemId = nextNature === "EXPENSE_SERVICE"
                            ? (isValidUuid(line.itemId) ? line.itemId : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : ""))
                            : "";
                          updateLine(idx, {
                            itemNature: nextNature,
                            itemId: nextItemId,
                            unit: nextNature === "EXPENSE_SERVICE" ? "ud" : "kg",
                            taxRate: nextNature === "EXPENSE_SERVICE" ? "21" : "10",
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INVENTORYABLE">📦 Stock</SelectItem>
                          <SelectItem value="EXPENSE_SERVICE">🛠️ Servicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3 space-y-1">
                      {line.itemNature === "EXPENSE_SERVICE" ? (
                        <Input
                          placeholder="Concepto de servicio"
                          className="h-8 text-xs"
                          value={line.itemName}
                          onChange={(e) => updateLine(idx, { itemName: e.target.value })}
                        />
                      ) : ingredients.length > 0 ? (
                        <Select
                          value={line.itemId}
                          onValueChange={(val) => updateLine(idx, { itemId: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Ingrediente..." />
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
                          placeholder="Nombre ingrediente"
                          className="h-8 text-xs"
                          value={line.itemName}
                          onChange={(e) => updateLine(idx, { itemName: e.target.value })}
                        />
                      )}
                      {line.itemNature !== "EXPENSE_SERVICE" && !line.itemId && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          ⚠️ Asignar ingrediente
                        </p>
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

                    <div className="col-span-1 space-y-1">
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
                Crear Factura Borrador (DRAFT)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal (CR-COST-05 Bloque 1) */}
      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Carga Asistida de Factura o Albarán
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sube un documento comercial (.pdf, imagen JPG/PNG/WebP, o .csv/.tsv/.txt) para extraer automáticamente cabecera y líneas candidatas según la regla anti-alucinación D-010.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,image/png,image/jpeg,image/webp,.csv,.tsv,.txt"
                disabled={isProcessingDoc}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessDocument(f);
                }}
              />
              {isProcessingDoc ? (
                <>
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Extrayendo y validando líneas con regla D-010…</p>
                  <p className="text-xs text-muted-foreground">Calculando SHA-256 y cotejando catálogo...</p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Arrastra un archivo o haz clic para explorar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PDF, JPG, PNG, WebP, CSV o TXT (máx. 10 MB)
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="bg-muted/40 p-3 rounded-lg text-[11px] text-muted-foreground space-y-1.5 border">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Gobernanza Anti-Alucinación D-010:
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Los datos extraídos se precargan en estado <strong>Borrador (DRAFT)</strong> para revisión humana soberana.</li>
                <li>Nunca se inventan precios, cantidades ni ingredientes ausentes.</li>
                <li>No se ejecuta ninguna mutación de inventario ni recálculo WAC hasta que el operador decida recepcionar.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadDocOpen(false)}
              disabled={isProcessingDoc}
            >
              Cancelar
            </Button>
          </DialogFooter>
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
                  {selectedInvoice.items.map((it) => {
                    const benchmarkCalc = benchmarksByIngredient.get(it.itemId);
                    const isMapped = mappings.some((m) => m.tenantIngredientId === it.itemId);

                    return (
                      <div
                        key={it.id}
                        className="p-2.5 bg-background border rounded flex justify-between items-center"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{it.itemName}</p>
                            <MarketBenchmarkBadge
                              benchmarkPriceExTax={benchmarkCalc?.benchmarkPriceExTax}
                              effectiveWacExTax={it.effectiveUnitCost}
                              unit={it.unit}
                              comparabilityGrade={benchmarkCalc?.components[0]?.comparabilityGrade}
                              isMapped={isMapped}
                            />
                          </div>
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
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Cerrar
              </Button>
              {(selectedInvoice.status === "draft" || selectedInvoice.status === "partially_received") && (
                <Button
                  disabled={busy}
                  onClick={() => handleOpenReceiveConfirmation(selectedInvoice)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Recepción Física & WAC
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Physical Warehouse Receipt Confirmation Modal (Atomic CR-COST-1A) */}
      {receiptPreview && (
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Truck className="h-5 w-5" />
                Confirmar Recepción Física en Almacén
              </DialogTitle>
              <DialogDescription className="text-xs">
                Esta acción ejecutará una <strong>transacción atómica en PostgreSQL</strong>. Incrementará las existencias reales en inventario, actualizará el coste medio ponderado (WAC) y registrará los asientos inmutables.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs pt-2">
              <div className="p-3 bg-muted/30 rounded border flex justify-between items-center">
                <div>
                  <span className="font-semibold text-sm">Factura {receiptPreview.invoiceNumber}</span>
                  <p className="text-muted-foreground mt-0.5">
                    {receiptPreview.lines.length} líneas detectadas · {receiptPreview.hasServices ? "Incluye servicios/gastos" : "Solo mercancía inventariable"}
                  </p>
                </div>
                <Badge variant={receiptPreview.hasServices ? "secondary" : "default"}>
                  {receiptPreview.totalStockIncrement > 0
                    ? `+${receiptPreview.totalStockIncrement} uds en stock`
                    : "Sin incremento físico"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Impacto Previsto en Inventario y Coste (WAC):</h4>
                <div className="space-y-2">
                  {receiptPreview.lines.map((l) => (
                    <div
                      key={l.lineId}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        l.stockMutated
                          ? "bg-background border-border/80"
                          : "bg-muted/20 border-dashed border-muted-foreground/30",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{l.itemName}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                l.stockMutated
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
                              )}
                            >
                              {l.itemNature === "EXPENSE_SERVICE"
                                ? "Servicio / Gasto (Sin Stock)"
                                : l.itemNature === "CAPEX_ASSET"
                                ? "Activo CAPEX (Sin Stock)"
                                : "Mercancía Inventariable"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            Cantidad a recepcionar: <strong>{l.quantityToReceive} {l.unit}</strong>
                          </p>
                          {l.unitConversionWarning && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              ⚠️ {l.unitConversionWarning}
                            </p>
                          )}
                        </div>

                        <div className="text-right space-y-1">
                          {l.stockMutated ? (
                            <>
                              <div className="text-[11px]">
                                <span className="text-muted-foreground">Stock: </span>
                                <span className="line-through text-muted-foreground">{l.currentStock.toFixed(2)}</span>
                                <span className="font-bold text-foreground"> → {l.predictedNewStock.toFixed(2)} {l.unit}</span>
                              </div>
                              <div className="text-[11px]">
                                <span className="text-muted-foreground">WAC: </span>
                                <span className="text-muted-foreground">{l.currentWac.toFixed(4)} €</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400"> → {l.predictedNewWac.toFixed(4)} €/{l.unit}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              Sin mutación en existencias
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-200">
                <p className="font-medium text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  Garantía de Integridad Transaccional:
                </p>
                <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                  Si cualquier línea o recálculo falla en el servidor, toda la operación se revertirá automáticamente sin alterar existencias ni costes.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={busy}
                onClick={handleConfirmAtomicReceipt}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Recepción Atómica en Almacén
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
