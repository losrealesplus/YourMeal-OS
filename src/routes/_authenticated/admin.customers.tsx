/**
 * ADMIN · Clientes — Hub Canónico Unificado de Clientes y Empresas (CR — Clientes Unificados).
 *
 * Master-Detail: Búsqueda universal, directorio consolidado y ficha integrada
 * (Perfil, Empresas B2B, Historial de Pedidos, Notas de Soporte y + Nuevo Pedido).
 *
 * Capabilities: customers.read / customers.write / company.manage
 * Sources of truth: CustomerDirectoryService / CompanyAccountService
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  Building2,
  Users,
  Archive,
  ExternalLink,
  Plus,
  ShoppingBag,
  LifeBuoy,
  User,
  Trash2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminHeader,
  DataTable,
  DrawerErrorBoundary,
  KpiCard,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import { formatErrorMessage } from "@/domain/errors";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";
import { useFmt } from "@/i18n/localization-provider";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CustomerDirectoryService,
  type CompanyDirectoryRecord,
  type IndividualCustomerRecord,
  type CustomerOrderSummary,
  type SupportNoteRecord,
} from "@/modules/customer-directory";
import {
  CompanyAccountService,
  type CompanyAccount,
  type CustomerCompanyMembershipRecord,
  type Site,
  type OrganizationalUnit,
} from "@/modules/company-account";
import { cn } from "@/lib/utils";

export type CustomerDetailTab = "profile" | "company" | "orders" | "support";

export type AdminCustomersSearch = {
  customerId?: string;
  tab?: CustomerDetailTab;
  category?: "all" | "individuals" | "companies";
};

export const Route = createFileRoute("/_authenticated/admin/customers")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "customers.read");
  },
  validateSearch: (search: Record<string, unknown>): AdminCustomersSearch => ({
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
    category:
      search.category === "all" ||
      search.category === "individuals" ||
      search.category === "companies"
        ? search.category
        : undefined,
  }),
  component: AdminCustomersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Clientes" },
      {
        name: "description",
        content:
          "Centro canónico de gestión de clientes: particulares, empresas, pedidos, soporte y membresías.",
      },
    ],
  }),
});

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminCustomersPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const activeCategory = searchParams.category ?? "individuals";
  const selectedCustomerId = searchParams.customerId ?? null;
  const activeDetailTab = searchParams.tab ?? "profile";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [individuals, setIndividuals] = useState<IndividualCustomerRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  // Selected Customer Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<IndividualCustomerRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerMemberships, setCustomerMemberships] = useState<CustomerCompanyMembershipRecord[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderSummary[]>([]);
  const [customerNotes, setCustomerNotes] = useState<SupportNoteRecord[]>([]);

  // Section-level Loading and Error States (Resilience Isolation)
  type SectionStatus = "idle" | "loading" | "success" | "error";
  const [profileStatus, setProfileStatus] = useState<SectionStatus>("idle");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [membershipsStatus, setMembershipsStatus] = useState<SectionStatus>("idle");
  const [membershipsError, setMembershipsError] = useState<string | null>(null);
  const [ordersStatus, setOrdersStatus] = useState<SectionStatus>("idle");
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [notesStatus, setNotesStatus] = useState<SectionStatus>("idle");
  const [notesError, setNotesError] = useState<string | null>(null);

  // Edit Profile Form State
  const [editProfileForm, setEditProfileForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    city: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Support Note Creation State
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteKind, setNewNoteKind] = useState<SupportNoteRecord["kind"]>("note");
  const [addingNote, setAddingNote] = useState(false);

  // Quick Create Customer Modal State
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createCustomerForm, setCreateCustomerForm] = useState({
    displayName: "",
    phone: "",
    city: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Link Customer to Company Modal State (Inside Customer Drawer)
  const [linkCompanyOpen, setLinkCompanyOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState<CompanyAccount[]>([]);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [availableUnits, setAvailableUnits] = useState<OrganizationalUnit[]>([]);
  const [linkForm, setLinkForm] = useState({
    companyId: "",
    siteId: "",
    organizationalUnitId: "",
    internalLocation: "",
    isAdmin: false,
  });
  const [linkingCompany, setLinkingCompany] = useState(false);

  // Universal Order Intake Drawer State
  const [orderIntakeOpen, setOrderIntakeOpen] = useState(false);

  const canWrite = can("customers.write");
  const canManageCompany = can("company.manage");
  const canWriteSupport = can("support.write") || canWrite;

  const getCtx = useCallback(async () => {
    if (!user || !tenantId) throw new Error("Tenant context required");
    return createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
  }, [user, tenantId, roles]);

  const reload = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await getCtx();
      const [inds, cos] = await Promise.all([
        CustomerDirectoryService.listIndividuals(ctx, {
          query,
          status: statusFilter === "all" ? "all" : (statusFilter as "active" | "inactive" | "new"),
        }),
        CustomerDirectoryService.listCompanies(ctx, {
          query,
          status:
            statusFilter === "all"
              ? "all"
              : statusFilter === "new"
                ? "all"
                : (statusFilter as "active" | "inactive"),
        }),
      ]);
      setIndividuals(inds);
      setCompanies(cos);
    } catch (e) {
      toast.error(formatErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, getCtx, query, statusFilter]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      reload().catch(() => undefined);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [reload]);

  // Per-section loaders (isolated failures)
  const loadProfile = useCallback(
    async (customerId: string) => {
      setProfileStatus("loading");
      setProfileError(null);
      try {
        const ctx = await getCtx();
        const cust = await CustomerDirectoryService.getIndividualById(ctx, customerId);
        if (cust) {
          setSelectedCustomer(cust);
          setEditProfileForm({
            displayName: cust.displayName || "",
            email: cust.email || "",
            phone: cust.phone || "",
            city: cust.city || "",
          });
          setProfileStatus("success");
        } else {
          setProfileStatus("error");
          setProfileError("No se encontró el registro del cliente.");
        }
      } catch (err) {
        setProfileStatus("error");
        setProfileError(formatErrorMessage(err, "Error al cargar los datos del perfil."));
      }
    },
    [getCtx],
  );

  const loadMemberships = useCallback(
    async (customerId: string) => {
      setMembershipsStatus("loading");
      setMembershipsError(null);
      try {
        const ctx = await getCtx();
        const memberships = await CompanyAccountService.listCustomerCompanyMemberships(ctx, customerId);
        setCustomerMemberships(memberships);
        setMembershipsStatus("success");
      } catch (err) {
        setMembershipsStatus("error");
        setMembershipsError(formatErrorMessage(err, "Error al cargar las empresas vinculadas."));
      }
    },
    [getCtx],
  );

  const loadOrders = useCallback(
    async (customerId: string) => {
      setOrdersStatus("loading");
      setOrdersError(null);
      try {
        const ctx = await getCtx();
        const orders = await CustomerDirectoryService.getCustomerOrders(ctx, customerId);
        setCustomerOrders(orders);
        setOrdersStatus("success");
      } catch (err) {
        setOrdersStatus("error");
        setOrdersError(formatErrorMessage(err, "Error al cargar el historial de pedidos."));
      }
    },
    [getCtx],
  );

  const loadNotes = useCallback(
    async (customerId: string) => {
      setNotesStatus("loading");
      setNotesError(null);
      try {
        const ctx = await getCtx();
        const notes = await CustomerDirectoryService.listSupportNotes(ctx, customerId);
        setCustomerNotes(notes);
        setNotesStatus("success");
      } catch (err) {
        setNotesStatus("error");
        setNotesError(formatErrorMessage(err, "Error al cargar las notas de soporte."));
      }
    },
    [getCtx],
  );

  // Load customer detail whenever selectedCustomerId changes (Promise.allSettled)
  const loadCustomerDetails = useCallback(
    async (customerId: string) => {
      setLoadingDetail(true);
      await Promise.allSettled([
        loadProfile(customerId),
        loadMemberships(customerId),
        loadOrders(customerId),
        loadNotes(customerId),
      ]);
      setLoadingDetail(false);
    },
    [loadProfile, loadMemberships, loadOrders, loadNotes],
  );

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDetails(selectedCustomerId);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, loadCustomerDetails]);

  // Load companies for linking dropdown
  useEffect(() => {
    if (linkCompanyOpen && user && tenantId) {
      getCtx()
        .then((ctx) => CompanyAccountService.listCompanies(ctx))
        .then((list) => setAllCompanies(list))
        .catch(() => undefined);
    }
  }, [linkCompanyOpen, user, tenantId, getCtx]);

  // Cascading load of sites when company is selected in Link dialog
  useEffect(() => {
    if (linkForm.companyId && user && tenantId) {
      getCtx()
        .then((ctx) => CompanyAccountService.listSites(ctx, linkForm.companyId))
        .then((sitesList) => {
          setAvailableSites(sitesList);
          if (sitesList.length > 0 && !linkForm.siteId) {
            setLinkForm((prev) => ({ ...prev, siteId: sitesList[0].id }));
          }
        })
        .catch(() => undefined);
    } else {
      setAvailableSites([]);
      setAvailableUnits([]);
    }
  }, [linkForm.companyId, user, tenantId, getCtx, linkForm.siteId]);

  // Cascading load of units when site is selected in Link dialog
  useEffect(() => {
    if (linkForm.siteId && user && tenantId) {
      getCtx()
        .then((ctx) => CompanyAccountService.listOrganizationalUnits(ctx, linkForm.siteId))
        .then((unitsList) => {
          setAvailableUnits(unitsList);
          if (unitsList.length > 0 && !linkForm.organizationalUnitId) {
            setLinkForm((prev) => ({ ...prev, organizationalUnitId: unitsList[0].id }));
          }
        })
        .catch(() => undefined);
    } else {
      setAvailableUnits([]);
    }
  }, [linkForm.siteId, user, tenantId, getCtx, linkForm.organizationalUnitId]);

  function openCustomerDrawer(customerId: string, tab: CustomerDetailTab = "profile") {
    navigate({
      to: "/admin/customers",
      search: (prev: any) => ({
        ...prev,
        customerId,
        tab,
      }),
    });
  }

  function closeCustomerDrawer() {
    navigate({
      to: "/admin/customers",
      search: (prev: any) => ({
        ...prev,
        customerId: undefined,
        tab: undefined,
      }),
    });
  }

  function switchDetailTab(tab: CustomerDetailTab) {
    navigate({
      to: "/admin/customers",
      search: (prev: any) => ({
        ...prev,
        tab,
      }),
    });
  }

  function switchCategory(category: "all" | "individuals" | "companies") {
    navigate({
      to: "/admin/customers",
      search: (prev: any) => ({
        ...prev,
        category,
        customerId: undefined,
        tab: undefined,
      }),
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !canWrite) return;
    setSavingProfile(true);
    try {
      const ctx = await getCtx();
      const updated = await CustomerDirectoryService.updateIndividual(ctx, selectedCustomer.id, {
        displayName: editProfileForm.displayName,
        email: editProfileForm.email || null,
        phone: editProfileForm.phone || null,
        city: editProfileForm.city || null,
      });
      setSelectedCustomer(updated);
      toast.success("Perfil actualizado correctamente");
      await reload();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddSupportNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !newNoteBody.trim() || !canWriteSupport) return;
    setAddingNote(true);
    try {
      const ctx = await getCtx();
      const note = await CustomerDirectoryService.addSupportNote(ctx, {
        customerId: selectedCustomer.id,
        kind: newNoteKind,
        body: newNoteBody.trim(),
      });
      setCustomerNotes((prev) => [note, ...prev]);
      setNewNoteBody("");
      toast.success("Nota añadida correctamente");
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setAddingNote(false);
    }
  }

  async function handleTransitionNote(noteId: string, toStatus: SupportNoteRecord["status"]) {
    if (!canWriteSupport) return;
    try {
      const ctx = await getCtx();
      const updated = await CustomerDirectoryService.transitionSupportNote(ctx, noteId, toStatus);
      setCustomerNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      toast.success(toStatus === "resolved" ? "Incidencia resuelta" : "Estado actualizado");
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  }

  async function handleLinkCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !linkForm.companyId) return;
    setLinkingCompany(true);
    try {
      const ctx = await getCtx();
      await CompanyAccountService.linkCustomerToCompany(ctx, {
        companyId: linkForm.companyId,
        customerId: selectedCustomer.id,
        siteId: linkForm.siteId || null,
        organizationalUnitId: linkForm.organizationalUnitId || null,
        internalLocation: linkForm.internalLocation.trim() || null,
        isAdmin: linkForm.isAdmin,
      });
      toast.success("Cliente vinculado a la empresa correctamente");
      setLinkCompanyOpen(false);
      setLinkForm({
        companyId: "",
        siteId: "",
        organizationalUnitId: "",
        internalLocation: "",
        isAdmin: false,
      });
      await loadCustomerDetails(selectedCustomer.id);
      await reload();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setLinkingCompany(false);
    }
  }

  async function handleUnlinkCompany(membership: CustomerCompanyMembershipRecord) {
    if (!window.confirm(`¿Desvincular a este cliente de ${membership.companyName}?`)) return;
    try {
      const ctx = await getCtx();
      await CompanyAccountService.unlinkCompanyEmployee(
        ctx,
        membership.companyId,
        membership.membershipId,
      );
      toast.success("Desvinculado correctamente");
      if (selectedCustomer) {
        await loadCustomerDetails(selectedCustomer.id);
      }
      await reload();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!createCustomerForm.displayName.trim() || !canWrite) return;
    setCreatingCustomer(true);
    try {
      const ctx = await getCtx();
      const newId = await CustomerDirectoryService.createIndividualStaff(ctx, {
        displayName: createCustomerForm.displayName.trim(),
        phone: createCustomerForm.phone.trim() || null,
        city: createCustomerForm.city.trim() || null,
      });
      toast.success("Cliente creado correctamente");
      setCreateCustomerOpen(false);
      setCreateCustomerForm({ displayName: "", phone: "", city: "" });
      await reload();
      openCustomerDrawer(newId, "profile");
    } catch (err) {
      toast.error(formatErrorMessage(err));
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function archiveCustomer(id: string, name: string) {
    if (!user || !tenantId || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de que deseas archivar al cliente "${name}"?`)) return;
    setArchivingId(id);
    try {
      const ctx = await getCtx();
      await CustomerDirectoryService.archiveCustomer(ctx, id);
      toast.success("Cliente archivado");
      if (selectedCustomerId === id) {
        closeCustomerDrawer();
      }
      await reload();
    } catch (e) {
      toast.error(formatErrorMessage(e));
    } finally {
      setArchivingId(null);
    }
  }

  const toneByStatus = {
    active: "positive" as const,
    inactive: "danger" as const,
    new: "warning" as const,
    archived: "neutral" as const,
  };

  const individualColumns: Column<IndividualCustomerRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (r) => (
          <div
            className="min-w-0 cursor-pointer group"
            onClick={() => openCustomerDrawer(r.id, "profile")}
          >
            <p className="font-semibold truncate group-hover:text-primary transition-colors">
              {r.displayName || "Sin nombre"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {r.kind === "company_employee" ? "Empleado empresa" : "Particular"}
              {r.companyName ? ` · ${r.companyName}` : ""}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (r) => <StatusChip tone={toneByStatus[r.status] ?? "neutral"} label={r.status} />,
      },
      {
        key: "email",
        header: "Correo",
        render: (r) => (
          <span className="text-xs truncate block max-w-[180px]">{r.email || "—"}</span>
        ),
      },
      {
        key: "phone",
        header: "Teléfono",
        render: (r) => <span className="text-xs">{r.phone || "—"}</span>,
      },
      {
        key: "city",
        header: "Ciudad",
        render: (r) => <span className="text-xs">{r.city || "—"}</span>,
      },
      {
        key: "last",
        header: "Último pedido",
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {r.lastOrderAt ? fmt.date(r.lastOrderAt, "medium") : "—"}
          </span>
        ),
      },
      {
        key: "orders",
        header: "Pedidos",
        className: "text-right",
        render: (r) => <span className="font-mono tabular-nums">{r.orderCount}</span>,
      },
      {
        key: "avg",
        header: "Ticket medio",
        className: "text-right",
        render: (r) => (
          <span className="font-mono tabular-nums">
            {fmt.currency(r.averageTicket, { currency: "EUR" })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Acciones",
        render: (r) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openCustomerDrawer(r.id, "profile")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
            >
              Ver ficha
            </button>
            {canWrite ? (
              <button
                type="button"
                disabled={archivingId === r.id}
                onClick={() => archiveCustomer(r.id, r.displayName ?? "Sin nombre")}
                className="text-xs font-semibold text-destructive hover:underline uppercase tracking-wider disabled:opacity-50"
              >
                Archivar
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fmt, canWrite, archivingId],
  );

  const companyColumns: Column<CompanyDirectoryRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (r) => (
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{r.companyCode}</p>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Responsable",
        render: (r) => (
          <div className="min-w-0">
            <p className="text-sm truncate">{r.contactName || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{r.contactEmail || "—"}</p>
          </div>
        ),
      },
      {
        key: "employees",
        header: "Empleados",
        className: "text-right",
        render: (r) => <span className="font-mono tabular-nums">{r.employeeCount}</span>,
      },
      {
        key: "orders",
        header: "Pedidos",
        className: "text-right",
        render: (r) => <span className="font-mono tabular-nums">{r.orderCount}</span>,
      },
      {
        key: "status",
        header: "Estado",
        render: (r) => (
          <StatusChip tone={r.status === "active" ? "positive" : "danger"} label={r.status} />
        ),
      },
      {
        key: "created",
        header: "Alta",
        render: (r) => (
          <span className="text-xs text-muted-foreground">{fmt.date(r.createdAt, "medium")}</span>
        ),
      },
      {
        key: "actions",
        header: "Acciones",
        render: (r) => (
          <Link
            to="/admin/companies"
            search={{ companyId: r.id }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
          >
            Gestionar
          </Link>
        ),
      },
    ],
    [fmt],
  );

  function handleExportCsv() {
    if (activeCategory === "individuals") {
      const csv = CustomerDirectoryService.toIndividualsCsv(individuals);
      downloadCsv(`clientes-particulares-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } else {
      const csv = CustomerDirectoryService.toCompaniesCsv(companies);
      downloadCsv(`empresas-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }
  }

  const individualMetrics = useMemo(() => {
    const total = individuals.length;
    const active = individuals.filter((i) => i.status === "active").length;
    const withOrders = individuals.filter((i) => i.orderCount > 0).length;
    return { total, active, withOrders };
  }, [individuals]);

  const companyMetrics = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "active").length;
    const totalEmployees = companies.reduce((acc, c) => acc + c.employeeCount, 0);
    return { total, active, totalEmployees };
  }, [companies]);

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        overline="Clientes"
        title="Directorio de Clientes"
        subtitle="Centro de Operaciones: localiza, filtra, gestiona membresías y formaliza pedidos."
      />

      <AdminHeader
        goal="Directorio unificado: búsqueda ágil, ficha integrada y relaciones empresa B2B"
        capability="customers.read"
        object="Clientes · Ficha Canónica · Empresas"
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {activeCategory === "individuals" ? (
          <>
            <KpiCard label="Particulares totales" value={String(individualMetrics.total)} />
            <KpiCard label="Clientes activos" value={String(individualMetrics.active)} />
            <KpiCard label="Con pedidos realizados" value={String(individualMetrics.withOrders)} />
          </>
        ) : (
          <>
            <KpiCard label="Empresas totales" value={String(companyMetrics.total)} />
            <KpiCard label="Empresas activas" value={String(companyMetrics.active)} />
            <KpiCard label="Empleados totales" value={String(companyMetrics.totalEmployees)} />
          </>
        )}
      </div>

      {/* Tabs Switcher: Todos vs Personas vs Empresas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchCategory("all")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              activeCategory === "all"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            Todos ({individuals.length + companies.length})
          </button>
          <button
            type="button"
            onClick={() => switchCategory("individuals")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              activeCategory === "individuals"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            <Users className="h-4 w-4" />
            Personas ({individuals.length})
          </button>
          <button
            type="button"
            onClick={() => switchCategory("companies")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              activeCategory === "companies"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            <Building2 className="h-4 w-4" />
            Empresas ({companies.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
          {canWrite ? (
            <Button
              size="sm"
              onClick={() => setCreateCustomerOpen(true)}
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          ) : null}
        </div>
      </div>

      {/* Directory Filter & Table */}
      <PanelCard className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-2 min-w-[240px]">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeCategory === "companies"
                  ? "Buscar por nombre de empresa, código, responsable…"
                  : "Buscar por nombre, email, teléfono, ciudad o empresa…"
              }
              className="max-w-md text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-xs font-semibold uppercase tracking-wider"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              {activeCategory !== "companies" ? <option value="new">Nuevos</option> : null}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-xs text-muted-foreground">Cargando directorio…</p>
        ) : activeCategory === "companies" ? (
          <DataTable
            columns={companyColumns}
            rows={companies}
            empty="No se encontraron empresas con los filtros aplicados."
          />
        ) : (
          <DataTable
            columns={individualColumns}
            rows={individuals}
            empty="No se encontraron clientes con los filtros aplicados."
          />
        )}
      </PanelCard>

      {/* ========================================================================= */}
      {/* DRAWER DE CLIENTE INTEGRADO (MASTER-DETAIL) */}
      {/* ========================================================================= */}
      <Sheet open={Boolean(selectedCustomerId)} onOpenChange={(open) => !open && closeCustomerDrawer()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6">
          <DrawerErrorBoundary onReset={() => selectedCustomerId && loadCustomerDetails(selectedCustomerId)}>
            {loadingDetail && !selectedCustomer ? (
              <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
                Cargando ficha del cliente…
              </div>
            ) : profileStatus === "error" && !selectedCustomer ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/30 bg-destructive/5 space-y-4 my-8">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-sm font-semibold text-foreground">
                    No se pudo cargar la ficha del cliente
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {profileError || "Error al obtener los datos del cliente."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectedCustomerId && loadCustomerDetails(selectedCustomerId)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reintentar
                </Button>
              </div>
            ) : selectedCustomer ? (
              <>
                {/* Customer Header */}
                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {selectedCustomer.displayName?.slice(0, 2).toUpperCase() || "CL"}
                      </div>
                      <div>
                        <SheetTitle className="text-xl font-bold text-foreground">
                          {selectedCustomer.displayName || "Sin nombre"}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                            {selectedCustomer.kind === "company_employee"
                              ? "Empleado Empresa"
                              : "Particular"}
                          </Badge>
                          <span>Alta: {fmt.date(selectedCustomer.createdAt, "medium")}</span>
                        </SheetDescription>
                      </div>
                    </div>
                    <StatusChip
                      tone={toneByStatus[selectedCustomer.status] ?? "neutral"}
                      label={selectedCustomer.status}
                    />
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setOrderIntakeOpen(true)}
                      className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground shadow-sm"
                    >
                      <Plus className="size-3.5" />
                      + Nuevo Pedido
                    </Button>
                    {canWrite ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          archiveCustomer(
                            selectedCustomer.id,
                            selectedCustomer.displayName ?? "Sin nombre",
                          )
                        }
                        className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Archive className="size-3.5" />
                        Archivar
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-border gap-2">
                  {[
                    { id: "profile", label: "Perfil", icon: User },
                    {
                      id: "company",
                      label: `Empresas (${customerMemberships.length})`,
                      icon: Building2,
                    },
                    {
                      id: "orders",
                      label: `Pedidos (${customerOrders.length})`,
                      icon: ShoppingBag,
                    },
                    {
                      id: "support",
                      label: `Soporte (${customerNotes.length})`,
                      icon: LifeBuoy,
                    },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => switchDetailTab(t.id as CustomerDetailTab)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
                          activeDetailTab === t.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="size-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: PERFIL */}
                {activeDetailTab === "profile" && (
                  <div className="space-y-5">
                    {profileStatus === "error" ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                        <p className="text-xs text-destructive font-medium">
                          {profileError || "Error al cargar los datos del perfil."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedCustomerId && loadProfile(selectedCustomerId)}
                          className="text-xs h-7 gap-1"
                        >
                          <RotateCcw className="size-3" /> Reintentar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1 sm:col-span-2">
                              <Label htmlFor="cust-name" className="text-xs font-semibold">
                                Nombre completo *
                              </Label>
                              <Input
                                id="cust-name"
                                value={editProfileForm.displayName}
                                onChange={(e) =>
                                  setEditProfileForm((prev) => ({ ...prev, displayName: e.target.value }))
                                }
                                required
                                disabled={!canWrite}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="cust-email" className="text-xs font-semibold">
                                Correo electrónico
                              </Label>
                              <Input
                                id="cust-email"
                                type="email"
                                value={editProfileForm.email}
                                onChange={(e) =>
                                  setEditProfileForm((prev) => ({ ...prev, email: e.target.value }))
                                }
                                disabled={!canWrite}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="cust-phone" className="text-xs font-semibold">
                                Teléfono
                              </Label>
                              <Input
                                id="cust-phone"
                                value={editProfileForm.phone}
                                onChange={(e) =>
                                  setEditProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                                }
                                disabled={!canWrite}
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label htmlFor="cust-city" className="text-xs font-semibold">
                                Ciudad / Población
                              </Label>
                              <Input
                                id="cust-city"
                                value={editProfileForm.city}
                                onChange={(e) =>
                                  setEditProfileForm((prev) => ({ ...prev, city: e.target.value }))
                                }
                                disabled={!canWrite}
                              />
                            </div>
                          </div>

                          {canWrite && (
                            <div className="flex justify-end pt-2">
                              <Button type="submit" size="sm" disabled={savingProfile}>
                                {savingProfile ? "Guardando…" : "Guardar Cambios"}
                              </Button>
                            </div>
                          )}
                        </form>

                        {/* Summary Metric Strip */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border sm:grid-cols-4">
                          <div className="rounded-lg border border-border p-3 bg-card text-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              Pedidos Totales
                            </p>
                            <p className="font-mono text-lg font-bold text-foreground">
                              {selectedCustomer.orderCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-3 bg-card text-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              Ticket Medio
                            </p>
                            <p className="font-mono text-lg font-bold text-foreground">
                              {fmt.currency(selectedCustomer.averageTicket, { currency: "EUR" })}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-3 bg-card text-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              Valor Total
                            </p>
                            <p className="font-mono text-lg font-bold text-foreground">
                              {fmt.currency(selectedCustomer.lifetimeTotal, { currency: "EUR" })}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-3 bg-card text-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              Último Pedido
                            </p>
                            <p className="text-xs font-semibold text-foreground truncate mt-1">
                              {selectedCustomer.lastOrderAt
                                ? fmt.date(selectedCustomer.lastOrderAt, "medium")
                                : "Ninguno"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 2: EMPRESAS / B2B */}
                {activeDetailTab === "company" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Empresas Vinculadas</h4>
                        <p className="text-xs text-muted-foreground">
                          Relaciones laborales activas y sedes de entrega asignadas.
                        </p>
                      </div>
                      {canManageCompany && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLinkCompanyOpen(true)}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <Plus className="size-3.5" />
                          Vincular a Empresa
                        </Button>
                      )}
                    </div>

                    {membershipsStatus === "loading" ? (
                      <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                        Cargando empresas vinculadas…
                      </div>
                    ) : membershipsStatus === "error" ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                        <p className="text-xs text-destructive font-medium">
                          {membershipsError || "Error al cargar empresas vinculadas."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedCustomerId && loadMemberships(selectedCustomerId)}
                          className="text-xs h-7 gap-1"
                        >
                          <RotateCcw className="size-3" /> Reintentar
                        </Button>
                      </div>
                    ) : customerMemberships.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Este cliente no está vinculado a ninguna empresa actualmente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerMemberships.map((m) => (
                          <div
                            key={m.membershipId}
                            className="rounded-lg border border-border p-4 bg-card space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-sm text-foreground">
                                    {m.companyName}
                                  </h5>
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {m.companyCode}
                                  </Badge>
                                  {m.isAdmin ? (
                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                      Admin Empresa
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Vinculado el {fmt.date(m.createdAt, "medium")}
                                </p>
                              </div>
                              {canManageCompany && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnlinkCompany(m)}
                                  className="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs"
                                >
                                  <Trash2 className="size-3.5 mr-1" />
                                  Desvincular
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Sede
                                </span>
                                <span className="font-semibold text-foreground">
                                  {m.siteName || "General / Sede principal"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Departamento
                                </span>
                                <span className="font-semibold text-foreground">
                                  {m.organizationalUnitName || "Sin asignar"}
                                </span>
                              </div>
                              {m.internalLocation && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                    Ubicación Interna
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {m.internalLocation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PEDIDOS */}
                {activeDetailTab === "orders" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground">Historial de Pedidos</h4>
                      <Link
                        to="/admin/orders"
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Ir a Consola de Pedidos <ExternalLink className="size-3" />
                      </Link>
                    </div>

                    {ordersStatus === "loading" ? (
                      <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                        Cargando historial de pedidos…
                      </div>
                    ) : ordersStatus === "error" ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                        <p className="text-xs text-destructive font-medium">
                          {ordersError || "Error al cargar el historial de pedidos."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedCustomerId && loadOrders(selectedCustomerId)}
                          className="text-xs h-7 gap-1"
                        >
                          <RotateCcw className="size-3" /> Reintentar
                        </Button>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        No hay pedidos registrados para este cliente todavía.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customerOrders.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg border border-border p-3 text-xs bg-card"
                          >
                            <div className="space-y-0.5">
                              <p className="font-mono font-bold text-foreground">
                                {o.id.slice(0, 8)}…
                              </p>
                              <p className="text-muted-foreground">
                                {fmt.date(o.createdAt, "medium")} · Canal:{" "}
                                <span className="font-semibold">
                                  {o.demandChannel === "company" ? "Empresa" : "B2C"}
                                </span>
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-mono font-bold text-foreground">
                                {fmt.currency(o.total, { currency: "EUR" })}
                              </p>
                              <StatusChip
                                tone={
                                  o.status === "delivered"
                                    ? "positive"
                                    : o.status === "cancelled"
                                      ? "danger"
                                      : "warning"
                                }
                                label={o.status}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SOPORTE */}
                {activeDetailTab === "support" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-foreground">Notas e Incidencias</h4>
                      {canWriteSupport && (
                        <form onSubmit={handleAddSupportNote} className="space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={newNoteKind}
                              onChange={(e) =>
                                setNewNoteKind(e.target.value as SupportNoteRecord["kind"])
                              }
                              className="h-9 rounded-md border border-border bg-background px-2 text-xs font-semibold"
                            >
                              <option value="note">Nota operativa</option>
                              <option value="incident">Incidencia</option>
                              <option value="request">Petición</option>
                              <option value="allergy_update">Alergias</option>
                              <option value="complaint">Reclamación</option>
                            </select>
                            <Input
                              placeholder="Escribe un apunte o incidencia del cliente…"
                              value={newNoteBody}
                              onChange={(e) => setNewNoteBody(e.target.value)}
                              className="text-xs h-9"
                            />
                            <Button type="submit" size="sm" disabled={addingNote || !newNoteBody.trim()}>
                              {addingNote ? "Añadiendo…" : "Añadir"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>

                    {notesStatus === "loading" ? (
                      <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                        Cargando notas de soporte…
                      </div>
                    ) : notesStatus === "error" ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                        <p className="text-xs text-destructive font-medium">
                          {notesError || "Error al cargar las notas de soporte."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedCustomerId && loadNotes(selectedCustomerId)}
                          className="text-xs h-7 gap-1"
                        >
                          <RotateCcw className="size-3" /> Reintentar
                        </Button>
                      </div>
                    ) : customerNotes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        No hay notas de soporte registradas.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customerNotes.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-lg border border-border p-3 bg-card space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-bold uppercase",
                                    n.kind === "incident" || n.kind === "complaint"
                                      ? "border-destructive text-destructive"
                                      : "border-border",
                                  )}
                                >
                                  {n.kind}
                                </Badge>
                                <span className="text-muted-foreground text-[11px]">
                                  {fmt.date(n.createdAt, "medium")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusChip
                                  tone={n.status === "resolved" ? "positive" : "warning"}
                                  label={n.status}
                                />
                                {canWriteSupport && n.status === "open" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTransitionNote(n.id, "resolved")}
                                    className="h-6 px-2 text-[10px] text-primary"
                                  >
                                    Resolver
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </DrawerErrorBoundary>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* DIALOG: VINCULAR A EMPRESA (DESDE CLIENTE) */}
      {/* ========================================================================= */}
      <Dialog open={linkCompanyOpen} onOpenChange={setLinkCompanyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular a Empresa</DialogTitle>
            <DialogDescription>
              Asigna a este cliente como empleado o administrador de una empresa del tenant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkCompany} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Empresa *</Label>
              <select
                value={linkForm.companyId}
                onChange={(e) =>
                  setLinkForm((prev) => ({
                    ...prev,
                    companyId: e.target.value,
                    siteId: "",
                    organizationalUnitId: "",
                  }))
                }
                required
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs"
              >
                <option value="">Selecciona una empresa…</option>
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyCode})
                  </option>
                ))}
              </select>
            </div>

            {availableSites.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sede de Entrega</Label>
                <select
                  value={linkForm.siteId}
                  onChange={(e) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      siteId: e.target.value,
                      organizationalUnitId: "",
                    }))
                  }
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  <option value="">Sede principal</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.address ? `(${s.address})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableUnits.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento / Unidad</Label>
                <select
                  value={linkForm.organizationalUnitId}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, organizationalUnitId: e.target.value }))
                  }
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  <option value="">General / Sin especificar</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ubicación Interna (Opcional)</Label>
              <Input
                placeholder="Ej. Planta 2, Despacho 4B…"
                value={linkForm.internalLocation}
                onChange={(e) =>
                  setLinkForm((prev) => ({ ...prev, internalLocation: e.target.value }))
                }
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="link-admin-chk"
                checked={linkForm.isAdmin}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, isAdmin: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="link-admin-chk" className="text-xs cursor-pointer">
                Rol Administrador de Empresa (permisos B2B)
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkCompanyOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={linkingCompany || !linkForm.companyId}>
                {linkingCompany ? "Vinculando…" : "Vincular"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: ALTA RÁPIDA DE CLIENTE */}
      {/* ========================================================================= */}
      <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Alta mínima de cliente para comenzar a operar o formalizar pedidos de inmediato.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nombre y Apellidos *</Label>
              <Input
                required
                placeholder="Ej. Carmen Navarro"
                value={createCustomerForm.displayName}
                onChange={(e) =>
                  setCreateCustomerForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Teléfono</Label>
              <Input
                placeholder="+34 600 000 000"
                value={createCustomerForm.phone}
                onChange={(e) =>
                  setCreateCustomerForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ciudad / Población</Label>
              <Input
                placeholder="Ej. Madrid"
                value={createCustomerForm.city}
                onChange={(e) =>
                  setCreateCustomerForm((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateCustomerOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingCustomer || !createCustomerForm.displayName.trim()}
              >
                {creatingCustomer ? "Creando…" : "Crear Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* UNIVERSAL ORDER INTAKE DRAWER (+ NUEVO PEDIDO) */}
      {/* ========================================================================= */}
      <UniversalOrderIntakeDrawer
        open={orderIntakeOpen}
        onOpenChange={setOrderIntakeOpen}
        preselectedCustomerId={selectedCustomer?.id}
        preselectedCustomerName={selectedCustomer?.displayName || undefined}
        preselectedCompanyId={
          customerMemberships.length === 1 ? customerMemberships[0].companyId : undefined
        }
        preselectedSiteId={
          customerMemberships.length === 1
            ? (customerMemberships[0].siteId || undefined)
            : undefined
        }
        preselectedOrganizationalUnitId={
          customerMemberships.length === 1
            ? (customerMemberships[0].organizationalUnitId || undefined)
            : undefined
        }
        onSuccess={() => {
          reload();
          if (selectedCustomer) {
            loadCustomerDetails(selectedCustomer.id);
          }
        }}
      />
    </div>
  );
}
