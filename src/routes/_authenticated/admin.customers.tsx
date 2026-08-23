/**
 * ADMIN · Clientes — Directorio Canónico de Particulares y Empresas (A2-C).
 *
 * El directorio descubre, filtra y localiza.
 * La gestión del cliente ocurre en el Customer Workspace (/admin/customer-workspace).
 * La gestión de empresas ocurre en Company Workspace (/admin/companies).
 *
 * Capability: customers.read / customers.write
 * Source of truth: CustomerDirectoryService
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Building2, Users, Archive, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { useFmt } from "@/i18n/localization-provider";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CustomerDirectoryService,
  type CompanyDirectoryRecord,
  type IndividualCustomerRecord,
} from "@/modules/customer-directory";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "customers.read");
  },
  component: AdminCustomersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Directorio de Clientes" },
      {
        name: "description",
        content:
          "Directorio canónico de particulares y empresas. Acceso directo a Customer Workspace.",
      },
    ],
  }),
});

type Tab = "individuals" | "companies";

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
  const [tab, setTab] = useState<Tab>("individuals");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [individuals, setIndividuals] = useState<IndividualCustomerRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const canWrite = can("customers.write");

  const reload = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const [inds, cos] = await Promise.all([
        CustomerDirectoryService.listIndividuals(ctx, {
          query,
          status: statusFilter === "all" ? "all" : (statusFilter as "active" | "inactive" | "new"),
          kind: "individual",
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
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, query, statusFilter]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      reload().catch(() => undefined);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [reload]);

  async function archiveCustomer(id: string, name: string) {
    if (!user || !tenantId || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de que deseas archivar al cliente "${name}"?`)) return;
    setArchivingId(id);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CustomerDirectoryService.archiveCustomer(ctx, id);
      toast.success("Cliente archivado");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
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
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.displayName || "Sin nombre"}</p>
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
            <Link
              to="/admin/customer-workspace"
              search={{ customerId: r.id, tab: "profile" }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
            >
              Ver ficha
            </Link>
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
    if (tab === "individuals") {
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
        overline="Customer Domain"
        title="Directorio de Clientes"
        subtitle="Localiza, filtra y accede a la ficha canónica de particulares y organizaciones."
      />

      <AdminHeader
        goal="Directorio unificado: búsqueda ágil y acceso directo a Customer Workspace"
        capability="customers.read"
        object="Directorio · Particulares · Empresas"
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {tab === "individuals" ? (
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

      {/* Tabs Switcher: Particulares vs Empresas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("individuals")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              tab === "individuals"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            <Users className="h-4 w-4" />
            Particulares ({individuals.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("companies")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              tab === "companies"
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
          <Link
            to="/admin/customer-workspace"
            search={{ customerId: undefined, tab: undefined }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:opacity-90 shadow-sm"
          >
            Abrir Workspace
          </Link>
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
                tab === "individuals"
                  ? "Buscar por nombre, email, teléfono, ciudad…"
                  : "Buscar por nombre de empresa, código, responsable…"
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
              {tab === "individuals" ? <option value="new">Nuevos</option> : null}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-xs text-muted-foreground">Cargando directorio…</p>
        ) : tab === "individuals" ? (
          <DataTable
            columns={individualColumns}
            rows={individuals}
            empty="No se encontraron clientes particulares con los filtros aplicados."
          />
        ) : (
          <DataTable
            columns={companyColumns}
            rows={companies}
            empty="No se encontraron empresas con los filtros aplicados."
          />
        )}
      </PanelCard>
    </div>
  );
}
