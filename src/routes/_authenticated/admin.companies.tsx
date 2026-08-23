/**
 * ADMIN · Clientes Empresa — Canonical Company Account Workspace (ADR 0015 / ADR 0016).
 * Capability: company.manage
 * Service: CompanyAccountService
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Network,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CompanyAccountService,
  type CompanyAccount,
  type CompanyEmployeeRecord,
  type OrganizationalUnit,
  type ProvisionCompanyInput,
  type Site,
  type UpdateCompanyInput,
  type UpdateOrganizationalUnitInput,
  type UpdateSiteInput,
} from "@/modules/company-account";
import {
  AdminHeader,
  DataTable,
  KpiCard,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useFmt } from "@/i18n/localization-provider";
import { cn } from "@/lib/utils";

type CompanySearch = {
  companyId?: string;
  fromCustomerId?: string;
};

export const Route = createFileRoute("/_authenticated/admin/companies")({
  validateSearch: (search: Record<string, unknown>): CompanySearch => ({
    companyId: typeof search.companyId === "string" ? search.companyId : undefined,
    fromCustomerId: typeof search.fromCustomerId === "string" ? search.fromCustomerId : undefined,
  }),
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "company.manage");
  },
  component: AdminCompaniesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Clientes Empresa" },
      {
        name: "description",
        content: "Gestión canónica de Company Accounts, sedes, unidades y empleados vinculados.",
      },
    ],
  }),
});

const emptyProvisionForm: ProvisionCompanyInput = {
  name: "",
  vatId: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  commercialTerms: "",
  fiscalAddress: "",
  deliveryAddress: "",
  orgUnitLabel: "Departamento",
  siteName: "Sede principal",
  unitName: "General",
};

type WorkspaceTab = "info" | "sites" | "units" | "employees";

function AdminCompaniesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const fmt = useFmt();
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const { companyId: paramCompanyId, fromCustomerId } = Route.useSearch();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(paramCompanyId ?? null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyAccount | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [employees, setEmployees] = useState<CompanyEmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("info");
  const [searchQuery, setSearchQuery] = useState("");

  // Provision form state
  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [provisionForm, setProvisionForm] = useState<ProvisionCompanyInput>(emptyProvisionForm);
  const [provisioning, setProvisioning] = useState(false);
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);

  // Edit Company modal state
  const [editingCompany, setEditingCompany] = useState<CompanyAccount | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState<UpdateCompanyInput>({});
  const [savingCompany, setSavingCompany] = useState(false);

  // Site modal state
  const [showCreateSiteDialog, setShowCreateSiteDialog] = useState(false);
  const [newSiteForm, setNewSiteForm] = useState({ name: "", address: "", city: "", zip: "" });
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editSiteForm, setEditSiteForm] = useState<UpdateSiteInput>({});
  const [savingSite, setSavingSite] = useState(false);

  // Unit modal state
  const [showCreateUnitDialog, setShowCreateUnitDialog] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({ siteId: "", name: "" });
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);
  const [editUnitForm, setEditUnitForm] = useState<UpdateOrganizationalUnitInput>({});
  const [savingUnit, setSavingUnit] = useState(false);

  const getCtx = useCallback(async () => {
    if (!user || !tenantId) throw new Error("Tenant context required");
    return createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
  }, [user, tenantId, roles]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const ctx = await getCtx();
      const list = await CompanyAccountService.listCompanies(ctx);
      setCompanies(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [getCtx]);

  const loadCompanyDetails = useCallback(
    async (companyId: string) => {
      try {
        const ctx = await getCtx();
        const comp = await CompanyAccountService.getCompany(ctx, companyId);
        setSelectedCompany(comp);

        const loadedSites = await CompanyAccountService.listSites(ctx, companyId);
        setSites(loadedSites);

        const allUnits: OrganizationalUnit[] = [];
        for (const s of loadedSites) {
          const sUnits = await CompanyAccountService.listOrganizationalUnits(ctx, s.id);
          allUnits.push(...sUnits);
        }
        setUnits(allUnits);

        const loadedEmployees = await CompanyAccountService.listCompanyEmployees(ctx, companyId);
        setEmployees(loadedEmployees);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [getCtx],
  );

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (paramCompanyId) {
      setSelectedCompanyId(paramCompanyId);
    }
  }, [paramCompanyId]);

  useEffect(() => {
    if (selectedCompanyId) {
      loadCompanyDetails(selectedCompanyId);
    } else {
      setSelectedCompany(null);
      setSites([]);
      setUnits([]);
      setEmployees([]);
    }
  }, [selectedCompanyId, loadCompanyDetails]);

  function selectCompany(id: string | null) {
    setSelectedCompanyId(id);
    navigate({
      to: "/admin/companies",
      search: { companyId: id ?? undefined },
    });
  }

  // --- Handlers: Company Provision & Edit ---
  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setProvisioning(true);
    try {
      const ctx = await getCtx();
      const result = await CompanyAccountService.provisionCompany(ctx, provisionForm);
      setLastCreatedCode(result.company.companyCode);
      setProvisionForm(emptyProvisionForm);
      setShowProvisionDialog(false);
      await loadCompanies();
      selectCompany(result.company.id);
      toast.success(t("admin:companyProvisioned", { defaultValue: "Empresa dada de alta" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setProvisioning(false);
    }
  }

  function startEditCompany(comp: CompanyAccount) {
    setEditingCompany(comp);
    setEditCompanyForm({
      name: comp.name,
      vatId: comp.vatId ?? "",
      contactName: comp.contactName ?? "",
      contactEmail: comp.contactEmail ?? "",
      contactPhone: comp.contactPhone ?? "",
      commercialTerms: comp.commercialTerms ?? "",
      fiscalAddress: comp.fiscalAddress ?? "",
      orgUnitLabel: comp.orgUnitLabel ?? "Departamento",
      internalLocationLabel: comp.internalLocationLabel ?? "Ubicación",
      billingRule: comp.billingRule ?? "grouped",
    });
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCompany) return;
    setSavingCompany(true);
    try {
      const ctx = await getCtx();
      const updated = await CompanyAccountService.updateCompany(
        ctx,
        editingCompany.id,
        editCompanyForm,
      );
      setSelectedCompany(updated);
      setEditingCompany(null);
      await loadCompanies();
      toast.success("Empresa actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingCompany(false);
    }
  }

  // --- Handlers: Sites ---
  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany) return;
    setSavingSite(true);
    try {
      const ctx = await getCtx();
      await CompanyAccountService.createSite(ctx, {
        companyId: selectedCompany.id,
        name: newSiteForm.name,
        address: newSiteForm.address || null,
      });
      setNewSiteForm({ name: "", address: "", city: "", zip: "" });
      setShowCreateSiteDialog(false);
      await loadCompanyDetails(selectedCompany.id);
      toast.success("Sede creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSite(false);
    }
  }

  function startEditSite(site: Site) {
    setEditingSite(site);
    setEditSiteForm({
      name: site.name,
      address: site.address ?? "",
      city: site.city ?? "",
      zip: site.zip ?? "",
      isActive: site.isActive,
    });
  }

  async function handleSaveSite(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSite || !selectedCompany) return;
    setSavingSite(true);
    try {
      const ctx = await getCtx();
      await CompanyAccountService.updateSite(ctx, {
        companyId: selectedCompany.id,
        siteId: editingSite.id,
        patch: editSiteForm,
      });
      setEditingSite(null);
      await loadCompanyDetails(selectedCompany.id);
      toast.success("Sede actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSite(false);
    }
  }

  // --- Handlers: Units ---
  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany || !newUnitForm.siteId) return;
    setSavingUnit(true);
    try {
      const ctx = await getCtx();
      await CompanyAccountService.createOrganizationalUnit(ctx, {
        companyId: selectedCompany.id,
        siteId: newUnitForm.siteId,
        name: newUnitForm.name,
      });
      setNewUnitForm({ siteId: "", name: "" });
      setShowCreateUnitDialog(false);
      await loadCompanyDetails(selectedCompany.id);
      toast.success("Unidad organizativa creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingUnit(false);
    }
  }

  function startEditUnit(unit: OrganizationalUnit) {
    setEditingUnit(unit);
    setEditUnitForm({
      name: unit.name,
      sortOrder: unit.sortOrder,
      isActive: unit.isActive,
    });
  }

  async function handleSaveUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUnit || !selectedCompany) return;
    setSavingUnit(true);
    try {
      const ctx = await getCtx();
      await CompanyAccountService.updateOrganizationalUnit(ctx, {
        companyId: selectedCompany.id,
        unitId: editingUnit.id,
        patch: editUnitForm,
      });
      setEditingUnit(null);
      await loadCompanyDetails(selectedCompany.id);
      toast.success("Unidad organizativa actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingUnit(false);
    }
  }

  // --- Filtered Directory List ---
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyCode.toLowerCase().includes(q) ||
        (c.vatId && c.vatId.toLowerCase().includes(q)) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        (c.contactEmail && c.contactEmail.toLowerCase().includes(q)),
    );
  }, [companies, searchQuery]);

  const companyColumns: Column<CompanyAccount>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Empresa",
        render: (r) => (
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{r.name}</p>
            <span className="font-mono text-xs font-bold text-primary tracking-wider">
              {r.companyCode}
            </span>
          </div>
        ),
      },
      {
        key: "vat",
        header: "CIF / NIF",
        render: (r) => (
          <span className="font-mono text-xs text-muted-foreground">{r.vatId || "—"}</span>
        ),
      },
      {
        key: "contact",
        header: "Contacto Principal",
        render: (r) => (
          <div className="min-w-0 text-sm">
            <p className="font-medium truncate">{r.contactName || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{r.contactEmail || "—"}</p>
          </div>
        ),
      },
      {
        key: "unitsLabel",
        header: "Unidad Organizativa",
        render: (r) => (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
            {r.orgUnitLabel || "Departamento"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Acciones",
        render: (r) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => selectCompany(r.id)}
            className="text-xs font-bold uppercase tracking-wider h-8"
          >
            Gestionar
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="animate-fade-in space-y-6">
      {fromCustomerId ? (
        <div>
          <Link
            to="/admin/customer-workspace"
            search={{ customerId: fromCustomerId, tab: "company" }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la ficha del empleado
          </Link>
        </div>
      ) : null}

      <SectionTitle
        overline="Clientes"
        title="Empresas (Company Accounts)"
        subtitle="Gestión comercial, sedes, departamentos y empleados vinculados."
      />
      <AdminHeader
        goal="Gestión integral de clientes B2B"
        capability="company.manage"
        object="Company Account · Sites · Org Units · Employees"
      />

      {lastCreatedCode ? (
        <Card className="p-4 border-primary/30 bg-primary/5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Company Code generado
            </p>
            <p className="font-mono text-2xl font-extrabold tracking-widest mt-1">
              {lastCreatedCode}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Código inmutable. Compártelo con la empresa para que los empleados puedan unirse.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setLastCreatedCode(null)}>
            Cerrar
          </Button>
        </Card>
      ) : null}

      {!selectedCompany ? (
        // ==================== LIST / DIRECTORY VIEW ====================
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <KpiCard label="Empresas registradas" value={String(companies.length)} trend="flat" />
            <KpiCard label="Capability activa" value="company.manage" trend="up" />
            <KpiCard label="Canal de demanda" value="B2B (Empresa)" trend="flat" />
          </div>

          <PanelCard>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa por nombre, código, CIF o contacto…"
                  className="pl-9 h-10"
                />
              </div>
              {can("company.manage") ? (
                <Button type="button" onClick={() => setShowProvisionDialog(true)} className="h-10">
                  <Plus className="size-4 mr-1.5" /> Nueva Empresa
                </Button>
              ) : null}
            </div>

            <DataTable<CompanyAccount>
              columns={companyColumns}
              rows={filteredCompanies}
              empty="No se encontraron Company Accounts registradas."
            />
          </PanelCard>
        </div>
      ) : (
        // ==================== CANONICAL COMPANY WORKSPACE / DETAIL VIEW ====================
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectCompany(null)}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" /> Todas las empresas
            </Button>
            {can("company.manage") ? (
              <Button
                type="button"
                size="sm"
                onClick={() => startEditCompany(selectedCompany)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Editar Empresa
              </Button>
            ) : null}
          </div>

          {/* Company Header Banner */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Building2 className="size-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{selectedCompany.name}</h2>
                    <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary tracking-wider">
                      {selectedCompany.companyCode}
                    </span>
                    <StatusChip tone="positive" label="Activa" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCompany.fiscalAddress || "Sin dirección fiscal registrada"}
                    {selectedCompany.vatId ? ` · CIF: ${selectedCompany.vatId}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {[
              { id: "info", label: "Información General", icon: Building2 },
              { id: "sites", label: `Sedes (${sites.length})`, icon: MapPin },
              {
                id: "units",
                label: `${selectedCompany.orgUnitLabel || "Departamentos"} (${units.length})`,
                icon: Network,
              },
              {
                id: "employees",
                label: `Empleados vinculados (${employees.length})`,
                icon: Users,
              },
            ].map((tItem) => {
              const Icon = tItem.icon;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setActiveTab(tItem.id as WorkspaceTab)}
                  className={cn(
                    "h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 border transition",
                    activeTab === tItem.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {tItem.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: INFORMACIÓN GENERAL */}
          {activeTab === "info" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PanelCard title="Contacto Comercial">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Persona de contacto
                    </dt>
                    <dd className="font-medium mt-0.5">{selectedCompany.contactName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Email de contacto
                    </dt>
                    <dd className="font-medium mt-0.5">{selectedCompany.contactEmail || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Teléfono
                    </dt>
                    <dd className="font-medium mt-0.5">{selectedCompany.contactPhone || "—"}</dd>
                  </div>
                </dl>
              </PanelCard>

              <PanelCard title="Condiciones Operativas">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Dirección fiscal
                    </dt>
                    <dd className="font-medium mt-0.5">{selectedCompany.fiscalAddress || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Condiciones comerciales
                    </dt>
                    <dd className="font-medium mt-0.5">
                      {selectedCompany.commercialTerms || "Estándar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Regla de facturación
                    </dt>
                    <dd className="font-mono text-xs mt-0.5">
                      {selectedCompany.billingRule || "grouped"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase font-semibold">
                      Etiqueta organizativa
                    </dt>
                    <dd className="font-medium mt-0.5">
                      {selectedCompany.orgUnitLabel || "Departamento"}
                    </dd>
                  </div>
                </dl>
              </PanelCard>
            </div>
          ) : null}

          {/* TAB 2: SEDES (SITES) */}
          {activeTab === "sites" ? (
            <PanelCard title="Sedes de la empresa">
              <div className="flex justify-end mb-4">
                {can("company.manage") ? (
                  <Button type="button" size="sm" onClick={() => setShowCreateSiteDialog(true)}>
                    <Plus className="size-4 mr-1.5" /> Nueva Sede
                  </Button>
                ) : null}
              </div>

              {sites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay sedes registradas para esta empresa.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sites.map((s) => (
                    <Card key={s.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{s.name}</p>
                          <StatusChip
                            tone={s.isActive ? "positive" : "neutral"}
                            label={s.isActive ? "Activa" : "Inactiva"}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.address || "Sin dirección"}
                          {s.city ? ` · ${s.city}` : ""}
                          {s.zip ? ` (${s.zip})` : ""}
                        </p>
                      </div>
                      {can("company.manage") ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditSite(s)}
                          className="h-8 text-xs uppercase tracking-wider font-semibold"
                        >
                          <Pencil className="size-3.5 mr-1" /> Editar
                        </Button>
                      ) : null}
                    </Card>
                  ))}
                </div>
              )}
            </PanelCard>
          ) : null}

          {/* TAB 3: UNIDADES ORGANIZATIVAS */}
          {activeTab === "units" ? (
            <PanelCard
              title={`Unidades Organizativas (${selectedCompany.orgUnitLabel || "Departamentos"})`}
            >
              <div className="flex justify-end mb-4">
                {can("company.manage") && sites.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setNewUnitForm({ siteId: sites[0]?.id || "", name: "" });
                      setShowCreateUnitDialog(true);
                    }}
                  >
                    <Plus className="size-4 mr-1.5" /> Nueva Unidad
                  </Button>
                ) : null}
              </div>

              {units.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay unidades organizativas registradas.
                </div>
              ) : (
                <div className="space-y-4">
                  {sites.map((site) => {
                    const siteUnits = units.filter((u) => u.siteId === site.id);
                    return (
                      <div
                        key={site.id}
                        className="rounded-xl border border-border p-4 bg-muted/10"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="size-4 text-primary" />
                          <h4 className="font-semibold text-sm">{site.name}</h4>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({siteUnits.length} unidades)
                          </span>
                        </div>
                        {siteUnits.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pl-6">
                            No hay unidades en esta sede.
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 pl-6">
                            {siteUnits.map((u) => (
                              <Card
                                key={u.id}
                                className="p-3 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{u.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Orden: {u.sortOrder}
                                  </p>
                                </div>
                                {can("company.manage") ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditUnit(u)}
                                    className="h-7 px-2"
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                ) : null}
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </PanelCard>
          ) : null}

          {/* TAB 4: EMPLEADOS VINCULADOS */}
          {activeTab === "employees" ? (
            <PanelCard title="Plantilla de Empleados">
              {employees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay empleados vinculados a esta empresa todavía. Los empleados se vinculan
                  usando el Company Code{" "}
                  <span className="font-mono font-bold text-foreground">
                    {selectedCompany.companyCode}
                  </span>{" "}
                  al unirse.
                </div>
              ) : (
                <DataTable<{ id: string } & CompanyEmployeeRecord>
                  columns={[
                    {
                      key: "name",
                      header: "Empleado",
                      render: (r) => (
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{r.displayName || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.email || "—"}</p>
                        </div>
                      ),
                    },
                    {
                      key: "site",
                      header: "Sede",
                      render: (r) => <span className="text-sm">{r.siteName || "—"}</span>,
                    },
                    {
                      key: "unit",
                      header: selectedCompany.orgUnitLabel || "Departamento",
                      render: (r) => (
                        <span className="text-sm">{r.organizationalUnitName || "—"}</span>
                      ),
                    },
                    {
                      key: "location",
                      header: "Ubicación Interna",
                      render: (r) => (
                        <span className="text-xs text-muted-foreground">
                          {r.internalLocation || "—"}
                        </span>
                      ),
                    },
                    {
                      key: "role",
                      header: "Rol B2B",
                      render: (r) => (
                        <StatusChip
                          tone={r.isAdmin ? "warning" : "neutral"}
                          label={r.isAdmin ? "Admin Empresa" : "Empleado"}
                        />
                      ),
                    },
                    {
                      key: "created",
                      header: "Alta",
                      render: (r) => (
                        <span className="text-xs text-muted-foreground">
                          {fmt.date(r.createdAt, "medium")}
                        </span>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Acciones",
                      render: () => (
                        <Link
                          to="/admin/customers"
                          className="text-xs font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Ver en Clientes <ExternalLink className="size-3" />
                        </Link>
                      ),
                    },
                  ]}
                  rows={employees.map((e) => ({ ...e, id: e.membershipId }))}
                  empty="No hay empleados vinculados."
                />
              )}
            </PanelCard>
          ) : null}
        </div>
      )}

      {/* ==================== DIALOG: NUEVA EMPRESA ==================== */}
      <Dialog open={showProvisionDialog} onOpenChange={setShowProvisionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alta de Empresa (Company Account)</DialogTitle>
            <DialogDescription>
              Creación comercial de la empresa, su sede principal y unidad organizativa inicial.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProvision} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="prov-name">Nombre Comercial *</Label>
                <Input
                  id="prov-name"
                  required
                  value={provisionForm.name}
                  onChange={(e) => setProvisionForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Hospital Parque Tenerife"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-vat">CIF / NIF</Label>
                <Input
                  id="prov-vat"
                  value={provisionForm.vatId ?? ""}
                  onChange={(e) => setProvisionForm((f) => ({ ...f, vatId: e.target.value }))}
                  placeholder="Ej. B38123456"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-terms">Condiciones Comerciales</Label>
                <Input
                  id="prov-terms"
                  value={provisionForm.commercialTerms ?? ""}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      commercialTerms: e.target.value,
                    }))
                  }
                  placeholder="Ej. Facturación mensual 30 días"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-contact">Persona de Contacto *</Label>
                <Input
                  id="prov-contact"
                  required
                  value={provisionForm.contactName}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      contactName: e.target.value,
                    }))
                  }
                  placeholder="Ej. Laura Gómez"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-email">Email de Contacto *</Label>
                <Input
                  id="prov-email"
                  type="email"
                  required
                  value={provisionForm.contactEmail}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      contactEmail: e.target.value,
                    }))
                  }
                  placeholder="laura@empresa.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-phone">Teléfono de Contacto</Label>
                <Input
                  id="prov-phone"
                  value={provisionForm.contactPhone ?? ""}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      contactPhone: e.target.value,
                    }))
                  }
                  placeholder="+34 922 000 000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-orglabel">Etiqueta de Unidades</Label>
                <Input
                  id="prov-orglabel"
                  value={provisionForm.orgUnitLabel ?? "Departamento"}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      orgUnitLabel: e.target.value,
                    }))
                  }
                  placeholder="Departamento, Área, Planta…"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="prov-fiscal">Dirección Fiscal *</Label>
                <Input
                  id="prov-fiscal"
                  required
                  value={provisionForm.fiscalAddress}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      fiscalAddress: e.target.value,
                    }))
                  }
                  placeholder="Calle, número, ciudad, código postal"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-site">Nombre Primera Sede</Label>
                <Input
                  id="prov-site"
                  value={provisionForm.siteName ?? "Sede principal"}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      siteName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov-unit">Nombre Primera Unidad</Label>
                <Input
                  id="prov-unit"
                  value={provisionForm.unitName ?? "General"}
                  onChange={(e) =>
                    setProvisionForm((f) => ({
                      ...f,
                      unitName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProvisionDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={provisioning}>
                {provisioning ? "Creando…" : "Crear Empresa y Generar Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: EDITAR EMPRESA ==================== */}
      <Dialog
        open={Boolean(editingCompany)}
        onOpenChange={(open) => !open && setEditingCompany(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Datos de Empresa</DialogTitle>
            <DialogDescription>
              Modifica la información comercial, fiscal y de contacto de la empresa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-name">Nombre Comercial *</Label>
                <Input
                  id="edit-name"
                  required
                  value={editCompanyForm.name ?? ""}
                  onChange={(e) => setEditCompanyForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-vat">CIF / NIF</Label>
                <Input
                  id="edit-vat"
                  value={editCompanyForm.vatId ?? ""}
                  onChange={(e) => setEditCompanyForm((f) => ({ ...f, vatId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-terms">Condiciones Comerciales</Label>
                <Input
                  id="edit-terms"
                  value={editCompanyForm.commercialTerms ?? ""}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      commercialTerms: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-contact">Persona de Contacto</Label>
                <Input
                  id="edit-contact"
                  value={editCompanyForm.contactName ?? ""}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      contactName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email de Contacto</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editCompanyForm.contactEmail ?? ""}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      contactEmail: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={editCompanyForm.contactPhone ?? ""}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      contactPhone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-orglabel">Etiqueta de Unidades</Label>
                <Input
                  id="edit-orglabel"
                  value={editCompanyForm.orgUnitLabel ?? "Departamento"}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      orgUnitLabel: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-fiscal">Dirección Fiscal</Label>
                <Input
                  id="edit-fiscal"
                  value={editCompanyForm.fiscalAddress ?? ""}
                  onChange={(e) =>
                    setEditCompanyForm((f) => ({
                      ...f,
                      fiscalAddress: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCompany(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingCompany}>
                {savingCompany ? "Guardando…" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: NUEVA SEDE ==================== */}
      <Dialog open={showCreateSiteDialog} onOpenChange={setShowCreateSiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Sede Corporativa</DialogTitle>
            <DialogDescription>
              Añade una sede o ubicación física para {selectedCompany?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSite} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="site-name">Nombre de la Sede *</Label>
              <Input
                id="site-name"
                required
                value={newSiteForm.name}
                onChange={(e) => setNewSiteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Sede Norte / Hospital La Candelaria"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-addr">Dirección de Entrega</Label>
              <Input
                id="site-addr"
                value={newSiteForm.address}
                onChange={(e) => setNewSiteForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Calle y número"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateSiteDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingSite}>
                {savingSite ? "Creando…" : "Crear Sede"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: EDITAR SEDE ==================== */}
      <Dialog open={Boolean(editingSite)} onOpenChange={(open) => !open && setEditingSite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sede</DialogTitle>
            <DialogDescription>Modifica los datos de la sede seleccionada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSite} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-site-name">Nombre *</Label>
              <Input
                id="edit-site-name"
                required
                value={editSiteForm.name ?? ""}
                onChange={(e) => setEditSiteForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-site-addr">Dirección</Label>
              <Input
                id="edit-site-addr"
                value={editSiteForm.address ?? ""}
                onChange={(e) => setEditSiteForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-site-city">Ciudad</Label>
                <Input
                  id="edit-site-city"
                  value={editSiteForm.city ?? ""}
                  onChange={(e) => setEditSiteForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-site-zip">Código Postal</Label>
                <Input
                  id="edit-site-zip"
                  value={editSiteForm.zip ?? ""}
                  onChange={(e) => setEditSiteForm((f) => ({ ...f, zip: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSite(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingSite}>
                {savingSite ? "Guardando…" : "Guardar Sede"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: NUEVA UNIDAD ORGANIZATIVA ==================== */}
      <Dialog open={showCreateUnitDialog} onOpenChange={setShowCreateUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nueva Unidad ({selectedCompany?.orgUnitLabel || "Departamento"})
            </DialogTitle>
            <DialogDescription>Crea una unidad organizativa asignada a una sede.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUnit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="unit-site">Sede de Asignación *</Label>
              <select
                id="unit-site"
                required
                value={newUnitForm.siteId}
                onChange={(e) => setNewUnitForm((f) => ({ ...f, siteId: e.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-name">Nombre de la Unidad *</Label>
              <Input
                id="unit-name"
                required
                value={newUnitForm.name}
                onChange={(e) => setNewUnitForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Quirófanos / Administración / Marketing"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUnitDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingUnit}>
                {savingUnit ? "Creando…" : "Crear Unidad"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: EDITAR UNIDAD ==================== */}
      <Dialog open={Boolean(editingUnit)} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidad Organizativa</DialogTitle>
            <DialogDescription>Modifica el nombre u orden de la unidad.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUnit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-unit-name">Nombre *</Label>
              <Input
                id="edit-unit-name"
                required
                value={editUnitForm.name ?? ""}
                onChange={(e) => setEditUnitForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-unit-sort">Orden de Visualización</Label>
              <Input
                id="edit-unit-sort"
                type="number"
                value={editUnitForm.sortOrder ?? 0}
                onChange={(e) =>
                  setEditUnitForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value),
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingUnit}>
                {savingUnit ? "Guardando…" : "Guardar Unidad"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
