/**
 * ADMIN · Clientes — Particulares + Empresas (datos reales).
 * Capability: customers.read / customers.write / company.manage
 * Shared repo: CustomerDirectoryService (+ CompanyAccountService for provision)
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Building2, Users, Pencil } from "lucide-react";
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
      { title: "YourMeal OS — Clientes" },
      {
        name: "description",
        content: "Gestión de particulares y empresas (datos reales).",
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
  const [editingCustomer, setEditingCustomer] = useState<IndividualCustomerRecord | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);

  function startEdit(customer: IndividualCustomerRecord) {
    setEditingCustomer(customer);
    setEditForm({
      displayName: customer.displayName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      city: customer.city || "",
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId || !editingCustomer || !can("customers.write")) return;
    if (!editForm.displayName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CustomerDirectoryService.updateCustomer(ctx, editingCustomer.id, {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        city: editForm.city.trim() || null,
      });
      toast.success("Cliente actualizado");
      setEditingCustomer(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

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

  async function archiveCustomer(id: string) {
    if (!user || !tenantId || !can("customers.write")) return;
    if (!window.confirm("¿Archivar este cliente? (soft delete)")) return;
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
        render: (r) => <StatusChip tone={toneByStatus[r.status]} label={r.status} />,
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
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/support"
              search={{ customerId: r.id }}
              className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
            >
              Ver
            </Link>
            {can("customers.write") ? (
              <button
                type="button"
                onClick={() => startEdit(r)}
                className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
              >
                Editar
              </button>
            ) : null}
            {can("customers.write") ? (
              <button
                type="button"
                disabled={archivingId === r.id}
                onClick={() => archiveCustomer(r.id)}
                className="text-xs font-semibold uppercase tracking-widest text-destructive hover:underline disabled:opacity-50"
              >
                Archivar
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fmt, can, archivingId],
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
        render: () => (
          <Link
            to="/admin/companies"
            className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            Gestionar
          </Link>
        ),
      },
    ],
    [fmt],
  );

  const particulares = individuals;
  const activeCount = particulares.filter((c) => c.status === "active").length;

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("customers")}
        title="Base de clientes"
        subtitle="Particulares y empresas — mismos datos que Atención al Cliente."
      />
      <AdminHeader
        goal="Conocer y gestionar la base activa"
        capability="customers.read"
        object="Customer · Company Account"
      />

      <div className="mb-6 rounded-md border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
        <span className="font-semibold">Capability Demo:</span>{" "}
        <Link
          to="/admin/customer-workspace"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Customer Workspace
        </Link>{" "}
        — construido solo con <code className="text-xs">useCustomer()</code> (LAW 003). Esta
        pantalla legacy aún habla con Services directo.
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label="Particulares" value={String(particulares.length)} trend="flat" />
        <KpiCard label="Activos" value={String(activeCount)} trend="up" />
        <KpiCard label="Empresas" value={String(companies.length)} trend="flat" />
        <KpiCard
          label="Empleados vinculados"
          value={String(companies.reduce((s, c) => s + c.employeeCount, 0))}
          trend="flat"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("individuals")}
          className={cn(
            "h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 border transition",
            tab === "individuals"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border hover:bg-secondary/60",
          )}
        >
          <Users className="size-3.5" /> Particulares
        </button>
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={cn(
            "h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 border transition",
            tab === "companies"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border hover:bg-secondary/60",
          )}
        >
          <Building2 className="size-3.5" /> Empresas
        </button>
      </div>

      <PanelCard>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo, código…"
            className="flex-1 min-w-[220px] h-10 rounded-xl border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold uppercase tracking-widest"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="new">Nuevos</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (tab === "individuals") {
                downloadCsv(
                  "clientes-particulares.csv",
                  CustomerDirectoryService.toIndividualsCsv(individuals),
                );
              } else {
                downloadCsv(
                  "clientes-empresas.csv",
                  CustomerDirectoryService.toCompaniesCsv(companies),
                );
              }
              toast.success("Exportación generada");
            }}
            className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition"
          >
            <Download className="size-3.5" /> Exportar
          </button>
          {tab === "companies" && can("company.manage") ? (
            <Link
              to="/admin/companies"
              className="h-10 rounded-xl bg-foreground text-background px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center hover:opacity-90 transition"
            >
              Alta empresa
            </Link>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
        ) : tab === "individuals" ? (
          <DataTable
            columns={individualColumns}
            rows={individuals}
            empty="No hay clientes particulares con estos filtros."
          />
        ) : (
          <DataTable
            columns={companyColumns}
            rows={companies}
            empty="No hay empresas. Créalas desde Administración → Clientes Empresa."
          />
        )}
      </PanelCard>

      <Dialog
        open={Boolean(editingCustomer)}
        onOpenChange={(open) => {
          if (!open) setEditingCustomer(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos de contacto y perfil del cliente en el Tenant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-customer-name">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-customer-name"
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Ej. Alexander Hernández"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-customer-email">Email</Label>
              <Input
                id="edit-customer-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="cliente@ejemplo.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-customer-phone">Teléfono</Label>
              <Input
                id="edit-customer-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-customer-city">Ciudad / Ubicación</Label>
              <Input
                id="edit-customer-city"
                value={editForm.city}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Madrid"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCustomer(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
