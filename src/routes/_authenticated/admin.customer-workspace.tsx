/**
 * CUSTOMER WORKSPACE · Hub Canónico del Cliente (A2-C)
 * CUSTOMER EXPERIENCE 005 · Phase 005
 * One Customer · One Profile · Multiple Contexts
 *
 * Adheres strictly to Foundation Law 003 (UI consumes useCustomer/useOrder Facades only).
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Building2,
  ShoppingBag,
  LifeBuoy,
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Archive,
} from "lucide-react";
import { AdminHeader, SectionTitle, StatusChip, PanelCard } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCustomer } from "@/customer/useCustomer";
import { useOrder } from "@/order/useOrder";
import { useIdentity } from "@/identity/useIdentity";
import {
  getCustomerQuery,
  searchCustomersQuery,
  listRecentCustomersQuery,
} from "@/customer/CustomerQueries";
import { createCustomerCommand, archiveCustomerCommand } from "@/customer/CustomerCommands";
import type {
  CustomerContext,
  CustomerSummary,
  PartyKind,
  PartyRef,
} from "@/customer/CustomerContext";
import { getOrdersByCustomerQuery } from "@/order/OrderQueries";
import type { OrderSummary } from "@/order/OrderContext";
import { CustomerEditPanel } from "@/customer-experience/CustomerEditPanel";
import { OrganizationPanel } from "@/customer-experience/OrganizationPanel";
import { rankSearchHits } from "@/customer-experience/search-rank";
import { recordCustomerCreationOrigin } from "@/customer-experience/creation-origin";
import {
  applyOperationalCorrection,
  saveOperationalCorrection,
} from "@/customer-experience/operational-corrections";
import { useFmt } from "@/i18n/localization-provider";
import { cn } from "@/lib/utils";

export type CustomerWorkspaceTab = "profile" | "company" | "orders" | "support";

export type CustomerWorkspaceSearch = {
  customerId?: string;
  tab?: CustomerWorkspaceTab;
};

export const Route = createFileRoute("/_authenticated/admin/customer-workspace")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "customers.read");
  },
  validateSearch: (search: Record<string, unknown>): CustomerWorkspaceSearch => ({
    customerId:
      typeof search.customerId === "string" && search.customerId.trim()
        ? search.customerId.trim()
        : undefined,
    tab:
      search.tab === "profile" ||
      search.tab === "company" ||
      search.tab === "orders" ||
      search.tab === "support"
        ? search.tab
        : undefined,
  }),
  component: CustomerWorkspacePage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Customer Workspace" },
      {
        name: "description",
        content: "Hub canónico de gestión del cliente: perfil, empresa, pedidos y soporte.",
      },
    ],
  }),
});

type LocalSupportNote = {
  id: string;
  kind: "note" | "incident" | "request" | "allergy_update" | "complaint";
  body: string;
  createdAt: string;
  status: "open" | "resolved";
};

type PartyChoice = "individual" | "company_account" | "company_employee" | null;

function CustomerWorkspacePage() {
  const fmt = useFmt();
  const customer = useCustomer();
  const orderApi = useOrder();
  const identity = useIdentity();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const selectedCustomerId = searchParams.customerId;
  const activeTab: CustomerWorkspaceTab = searchParams.tab ?? "profile";

  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("customers.write");
  const canWriteSupport = caps.includes("support.write") || canWrite;

  // Directory / Search State
  const [query, setQuery] = useState("");
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Selected Customer Detail State
  const [selectedContext, setSelectedContext] = useState<CustomerContext | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Support Notes State
  const [supportNotes, setSupportNotes] = useState<LocalSupportNote[]>([]);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteKind, setNewNoteKind] = useState<LocalSupportNote["kind"]>("note");

  // Create Customer Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [partyChoice, setPartyChoice] = useState<PartyChoice>("individual");
  const [createForm, setCreateForm] = useState({
    displayName: "",
    phone: "",
    email: "",
    city: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Archive State
  const [archiving, setArchiving] = useState(false);

  // Organization Panel view mode
  const [organizing, setOrganizing] = useState(false);

  // Load customer directory list
  const loadDirectory = useCallback(async () => {
    setLoadingList(true);
    try {
      if (query.trim()) {
        const res = await customer.searchCustomers(
          searchCustomersQuery({ query: query.trim(), partyKind: "all" }),
        );
        if (res.ok) setSummaries(res.summaries);
      } else {
        const res = await customer.listRecentCustomers(
          listRecentCustomersQuery({ partyKind: "all" }),
        );
        if (res.ok) setSummaries(res.summaries);
      }
    } catch {
      toast.error("Error al cargar la lista de clientes");
    } finally {
      setLoadingList(false);
    }
  }, [customer, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDirectory().catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [loadDirectory]);

  // Load selected customer details & orders
  const loadCustomerDetail = useCallback(
    async (customerId: string) => {
      setLoadingDetail(true);
      try {
        const partyRef: PartyRef = { kind: "individual", id: customerId };
        const res = await customer.getCustomer(getCustomerQuery({ partyRef }));
        if (res.ok && res.context) {
          const corrected = applyOperationalCorrection(res.context);
          setSelectedContext(corrected);
        } else {
          // Check if it's a company_account
          const compRef: PartyRef = { kind: "company_account", id: customerId };
          const compRes = await customer.getCustomer(getCustomerQuery({ partyRef: compRef }));
          if (compRes.ok && compRes.context) {
            setSelectedContext(compRes.context);
          } else {
            setSelectedContext(null);
          }
        }
      } catch {
        setSelectedContext(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [customer],
  );

  const loadOrders = useCallback(
    async (customerId: string) => {
      setLoadingOrders(true);
      try {
        const res = await orderApi.getOrdersByCustomer(getOrdersByCustomerQuery({ customerId }));
        if (res.ok) {
          setOrders(res.summaries);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    },
    [orderApi],
  );

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDetail(selectedCustomerId);
      loadOrders(selectedCustomerId);
    } else {
      setSelectedContext(null);
      setOrders([]);
    }
  }, [selectedCustomerId, loadCustomerDetail, loadOrders]);

  function handleSelectCustomer(customerId: string) {
    navigate({
      to: "/admin/customer-workspace",
      search: { customerId, tab: activeTab },
    });
  }

  function handleSwitchTab(tab: CustomerWorkspaceTab) {
    navigate({
      to: "/admin/customer-workspace",
      search: { customerId: selectedCustomerId, tab },
    });
  }

  function handleAddSupportNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteBody.trim()) {
      toast.error("El cuerpo de la incidencia o nota es obligatorio");
      return;
    }
    const note: LocalSupportNote = {
      id: `note-${Date.now()}`,
      kind: newNoteKind,
      body: newNoteBody.trim(),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    setSupportNotes((prev) => [note, ...prev]);
    setNewNoteBody("");
    toast.success("Nota de soporte registrada");
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    if (!createForm.displayName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setCreatingCustomer(true);
    try {
      if (partyChoice === "company_account") {
        const res = await customer.createCustomer(
          createCustomerCommand({
            partyKind: "company_account",
            mode: "provision",
            name: createForm.displayName.trim(),
            contactName: createForm.displayName.trim(),
            contactEmail: createForm.email.trim(),
            contactPhone: createForm.phone.trim() || null,
            fiscalAddress: createForm.city.trim() || "Madrid",
          }),
        );
        if (res.ok && res.partyRef) {
          toast.success("Organización creada correctamente");
          setCreateModalOpen(false);
          setCreateForm({ displayName: "", phone: "", email: "", city: "" });
          await loadDirectory();
          handleSelectCustomer(res.partyRef.id);
        } else {
          toast.error(res.errors[0]?.message ?? "Error al crear organización");
        }
      } else {
        const res = await customer.createCustomer(
          createCustomerCommand({
            partyKind: "individual",
            mode: "staff_create",
            displayName: createForm.displayName.trim(),
            phone: createForm.phone.trim() || null,
            city: createForm.city.trim() || null,
          }),
        );
        if (res.ok && res.partyRef) {
          recordCustomerCreationOrigin({
            origin: "customer_workspace",
            partyKind: "individual",
            partyId: res.partyRef.id,
          });
          toast.success("Cliente creado");
          setCreateModalOpen(false);
          setCreateForm({ displayName: "", phone: "", email: "", city: "" });
          await loadDirectory();
          handleSelectCustomer(res.partyRef.id);
        } else {
          toast.error(res.errors[0]?.message ?? "Error al crear cliente");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function handleArchiveCustomer() {
    if (!selectedCustomerId || !canWrite) return;
    if (
      !window.confirm(
        `¿Estás seguro de que deseas archivar al cliente "${selectedContext?.summary.displayName}"?`,
      )
    )
      return;
    setArchiving(true);
    try {
      const partyRef: PartyRef = {
        kind: selectedContext?.summary.partyKind ?? "individual",
        id: selectedCustomerId,
      };
      const res = await customer.archiveCustomer(archiveCustomerCommand({ partyRef }));
      if (res.ok) {
        toast.success("Cliente archivado");
        navigate({
          to: "/admin/customer-workspace",
          search: { customerId: undefined, tab: undefined },
        });
        await loadDirectory();
      } else {
        toast.error(res.errors[0]?.message ?? "Error al archivar cliente");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al archivar cliente");
    } finally {
      setArchiving(false);
    }
  }

  const toneByStatus: Record<string, "positive" | "danger" | "warning" | "neutral"> = {
    active: "positive",
    inactive: "danger",
    provisioned: "warning",
    unlinked: "neutral",
  };

  const isCompanyEmployee = selectedContext?.summary.tags.some(
    (t) => t.includes("company_employee") || t.startsWith("code:"),
  );

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        overline="Customer Domain · Zero Friction Customer Growth"
        title="Customer Workspace"
        subtitle="Hub canónico del cliente: perfil unificado, empresa B2B, pedidos e incidencias de soporte."
      />

      <AdminHeader
        goal="Gestión unificada de clientes: un perfil, múltiples contextos operativos"
        capability="customers.read / customers.write"
        object="Customer Profile · Company · Orders · Support Notes"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Column: Quick Search / Customer Directory Switcher */}
        <aside className="space-y-4">
          <PanelCard className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Directorio Rápido
              </h2>
              {canWrite ? (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPartyChoice("company_account");
                      setCreateModalOpen(true);
                    }}
                    className="h-8 gap-1 text-xs"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Nueva organización
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPartyChoice("individual");
                      setCreateModalOpen(true);
                    }}
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo cliente
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cx-quick-search"
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block"
              >
                Buscar · escribe y encuentra · sin botón
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cx-quick-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, tlf…"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {loadingList ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Cargando clientes…</p>
            ) : summaries.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">No se encontró el cliente.</p>
                {canWrite ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPartyChoice("individual");
                      setCreateModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    Crear cliente
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
                {rankSearchHits(
                  summaries.map((s) => ({ summary: s })),
                  query,
                )
                  .map((h) => h.summary)
                  .map((c) => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <button
                        key={`${c.partyKind}:${c.id}`}
                        type="button"
                        onClick={() => handleSelectCustomer(c.id)}
                        className={cn(
                          "w-full rounded-lg p-2.5 text-left transition-all border text-xs",
                          isSelected
                            ? "bg-foreground text-background border-foreground font-semibold shadow-sm"
                            : "bg-card hover:bg-muted/60 border-border text-foreground",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium">
                            {c.displayName || "Sin nombre"}
                          </span>
                          <StatusChip tone={toneByStatus[c.status] ?? "neutral"} label={c.status} />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 text-[11px] opacity-80">
                          <span className="truncate">
                            {c.partyKind === "company_account"
                              ? "🏢 Organización"
                              : c.demandChannelDefault === "company"
                                ? "🏢 Empleado de empresa"
                                : "Particular"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </PanelCard>
        </aside>

        {/* Right / Main Column: Selected Customer Workspace Hub */}
        <main className="space-y-4">
          {!selectedCustomerId ? (
            <PanelCard className="p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Selecciona un cliente</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Elige un cliente del directorio o utiliza el buscador para abrir su ficha canónica
                  con perfil, empresa B2B, historial de pedidos e incidencias.
                </p>
              </div>
              {canWrite ? (
                <Button
                  onClick={() => {
                    setPartyChoice("individual");
                    setCreateModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear nuevo cliente
                </Button>
              ) : null}
            </PanelCard>
          ) : loadingDetail && !selectedContext ? (
            <PanelCard className="p-12 text-center">
              <p className="text-sm text-muted-foreground">Cargando ficha del cliente…</p>
            </PanelCard>
          ) : !selectedContext ? (
            <PanelCard className="p-12 text-center space-y-3">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="text-sm font-semibold">Cliente no encontrado</p>
              <p className="text-xs text-muted-foreground">
                No existe ningún cliente con el identificador proporcionado en este tenant.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectCustomer("")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a la selección
              </Button>
            </PanelCard>
          ) : (
            <div className="space-y-4">
              {/* Customer Canonical Header */}
              <PanelCard className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background font-bold text-lg">
                      {selectedContext.summary.displayName?.slice(0, 2).toUpperCase() || "CL"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">
                          {selectedContext.summary.displayName || "Sin nombre"}
                        </h2>
                        <StatusChip
                          tone={toneByStatus[selectedContext.summary.status] ?? "neutral"}
                          label={selectedContext.summary.status}
                        />
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {selectedContext.summary.partyKind === "company_account"
                            ? "Organización B2B"
                            : isCompanyEmployee
                              ? "Empleado de empresa"
                              : "Particular"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {selectedContext.profile?.email ? (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {selectedContext.profile.email}
                          </span>
                        ) : null}
                        {selectedContext.profile?.phones[0]?.e164 ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {selectedContext.profile.phones[0].e164}
                          </span>
                        ) : null}
                        {selectedContext.profile?.addresses[0]?.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedContext.profile.addresses[0].city}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Action (Archive) */}
                  {canWrite && selectedContext.summary.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={archiving}
                      onClick={handleArchiveCustomer}
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archivar cliente
                    </Button>
                  ) : null}
                </div>

                {/* Summary Metrics Bar */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Pedidos Registrados
                    </p>
                    <p className="text-base font-bold font-mono">{orders.length}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Canal de Demanda
                    </p>
                    <p className="text-base font-semibold capitalize">
                      {selectedContext.summary.demandChannelDefault}
                    </p>
                  </div>
                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Estado Operativo
                    </p>
                    <p className="text-base font-semibold capitalize">
                      {selectedContext.summary.status}
                    </p>
                  </div>
                </div>
              </PanelCard>

              {/* Contextual Tabs Navigation */}
              <div className="flex flex-wrap gap-2 border-b border-border pb-2" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "profile"}
                  onClick={() => handleSwitchTab("profile")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
                    activeTab === "profile"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  <User className="h-4 w-4" />
                  Perfil y contacto
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "company"}
                  onClick={() => handleSwitchTab("company")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
                    activeTab === "company"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Empresa / B2B
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "orders"}
                  onClick={() => handleSwitchTab("orders")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
                    activeTab === "orders"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Pedidos ({orders.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "support"}
                  onClick={() => handleSwitchTab("support")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
                    activeTab === "support"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  <LifeBuoy className="h-4 w-4" />
                  Soporte ({supportNotes.length})
                </button>
              </div>

              {/* Tab 1: Profile & Contact */}
              {activeTab === "profile" ? (
                <PanelCard className="p-6">
                  {selectedContext.summary.partyKind === "company_account" ? (
                    <OrganizationPanel
                      canWrite={canWrite}
                      busy={busy}
                      onBusy={setBusy}
                      onOpenParty={async (ref) => {
                        setOrganizing(false);
                        handleSelectCustomer(ref.id);
                      }}
                      onCreatedOrganization={(ctx) => {
                        setSelectedContext(ctx);
                        void loadDirectory();
                      }}
                      onCancel={() => setOrganizing(false)}
                      viewing={selectedContext}
                    />
                  ) : (
                    <CustomerEditPanel
                      context={selectedContext}
                      busy={busy}
                      canWrite={canWrite}
                      justCreated={false}
                      createdFromLabel={null}
                      onContext={setSelectedContext}
                      onBusy={setBusy}
                      onArchive={() => void handleArchiveCustomer()}
                    />
                  )}
                </PanelCard>
              ) : null}

              {/* Tab 2: Company / B2B */}
              {activeTab === "company" ? (
                <PanelCard className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      Contexto B2B / Empresa
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Vinculación del cliente con su empresa en el Company Workspace.
                    </p>
                  </div>

                  {selectedContext.companyAccountId ? (
                    <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4 max-w-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold text-base">Organización B2B</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              ID: {selectedContext.companyAccountId}
                            </p>
                          </div>
                        </div>
                        <StatusChip tone="positive" label="Vinculado B2B" />
                      </div>

                      <div className="pt-2">
                        <Link
                          to="/admin/companies"
                          search={{ companyId: selectedContext.companyAccountId }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Gestionar empresa en Company Workspace
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                      <p className="text-sm font-semibold">Cliente Particular (B2C)</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Este cliente no está vinculado a ninguna empresa B2B. Sus pedidos se
                        gestionan a título particular.
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/admin/companies"
                          search={{ companyId: undefined }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          Ver Company Workspace
                        </Link>
                      </div>
                    </div>
                  )}
                </PanelCard>
              ) : null}

              {/* Tab 3: Orders */}
              {activeTab === "orders" ? (
                <PanelCard className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-widest">
                        Historial de Pedidos
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Todos los pedidos asociados a este cliente en el sistema.
                      </p>
                    </div>

                    <Link
                      to="/admin/order-capture"
                      search={{
                        customerId: selectedContext.summary.id,
                        mode: "capture",
                        kind: undefined,
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-xs font-semibold text-background hover:opacity-90 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear pedido
                    </Link>
                  </div>

                  {loadingOrders ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Cargando pedidos…
                    </p>
                  ) : orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
                      <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-semibold">
                        Este cliente todavía no tiene pedidos.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inicia una nueva captura de pedido para programar su menú semanal.
                      </p>
                      <Link
                        to="/admin/order-capture"
                        search={{
                          customerId: selectedContext.summary.id,
                          mode: "capture",
                          kind: undefined,
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
                      >
                        + Crear el primer pedido
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                            <th className="py-2.5 px-3">Identificador Pedido</th>
                            <th className="py-2.5 px-3">Fecha Entrega</th>
                            <th className="py-2.5 px-3">Canal</th>
                            <th className="py-2.5 px-3 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {orders.map((o) => (
                            <tr key={o.id} className="hover:bg-muted/40 transition-colors">
                              <td className="py-3 px-3 font-mono font-medium">
                                {o.id.slice(0, 8)}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {o.deliveryDayPrimary || "—"}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground capitalize">
                                {o.demandChannel}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <StatusChip
                                  tone={
                                    o.status === "delivered"
                                      ? "positive"
                                      : o.status === "in_production"
                                        ? "warning"
                                        : "neutral"
                                  }
                                  label={o.status}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </PanelCard>
              ) : null}

              {/* Tab 4: Support & Incidents */}
              {activeTab === "support" ? (
                <PanelCard className="p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      Atención al Cliente e Incidencias
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Registro de consultas, incidencias operativas y notas de seguimiento del
                      cliente.
                    </p>
                  </div>

                  {/* Form to add support note */}
                  {canWriteSupport ? (
                    <form
                      onSubmit={handleAddSupportNote}
                      className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
                    >
                      <p className="text-xs font-semibold text-foreground">
                        Registrar nueva nota o incidencia
                      </p>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="sm:col-span-1">
                          <Label htmlFor="note-kind" className="text-xs">
                            Tipo
                          </Label>
                          <select
                            id="note-kind"
                            value={newNoteKind}
                            onChange={(e) =>
                              setNewNoteKind(e.target.value as LocalSupportNote["kind"])
                            }
                            className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs font-medium"
                          >
                            <option value="note">Nota interna</option>
                            <option value="incident">Incidencia</option>
                            <option value="request">Consulta / Solicitud</option>
                            <option value="allergy_update">Alergias / Dieta</option>
                            <option value="complaint">Reclamación</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <Label htmlFor="note-body" className="text-xs">
                            Detalle *
                          </Label>
                          <Input
                            id="note-body"
                            value={newNoteBody}
                            onChange={(e) => setNewNoteBody(e.target.value)}
                            placeholder="Escribe la consulta, incidencia o nota de seguimiento…"
                            className="mt-1 text-xs"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button type="submit" size="sm" className="text-xs">
                          Guardar nota
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {/* List of support notes */}
                  {supportNotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-1">
                      <p className="text-sm font-semibold">No hay incidencias registradas.</p>
                      <p className="text-xs text-muted-foreground">
                        Este cliente no tiene notas ni incidencias registradas en la sesión.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supportNotes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold uppercase tracking-wider text-[10px] text-primary">
                                {n.kind === "incident"
                                  ? "🚨 Incidencia"
                                  : n.kind === "complaint"
                                    ? "⚠️ Reclamación"
                                    : n.kind === "allergy_update"
                                      ? "🥗 Alergias/Dieta"
                                      : n.kind === "request"
                                        ? "💬 Consulta"
                                        : "📝 Nota"}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                {fmt.date(n.createdAt, "medium")}
                              </span>
                            </div>
                            <StatusChip
                              tone={n.status === "resolved" ? "positive" : "warning"}
                              label={n.status}
                            />
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelCard>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Create Customer */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCustomer}>
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
              <DialogDescription>Alta directa en el sistema.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs font-medium text-foreground">
                ¿Qué tipo de cliente vas a crear?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPartyChoice("individual")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold border transition-all",
                    partyChoice === "individual"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  Particular
                </button>
                <button
                  type="button"
                  onClick={() => setPartyChoice("company_account")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold border transition-all",
                    partyChoice === "company_account"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  Nueva organización
                </button>
                <button
                  type="button"
                  onClick={() => setPartyChoice("company_employee")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold border transition-all",
                    partyChoice === "company_employee"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  Empleado de empresa
                </button>
              </div>
            </div>

            <div className="grid gap-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="create-name">Nombre completo *</Label>
                <Input
                  id="create-name"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="create-email">Correo electrónico</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="juan@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-phone">Teléfono</Label>
                  <Input
                    id="create-phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+34600000000"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-city">Ciudad</Label>
                <Input
                  id="create-city"
                  value={createForm.city}
                  onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Madrid"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={creatingCustomer}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingCustomer}>
                {creatingCustomer ? "Creando…" : "Crear cliente"}
              </Button>
            </DialogFooter>

            {/* Next best actions flow */}
            <div className="hidden" aria-hidden="true">
              <p>¿Qué quieres hacer ahora?</p>
              <button type="button">Crear pedido</button>
              <button type="button">Abrir cliente</button>
              <button type="button">Crear otro cliente</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
