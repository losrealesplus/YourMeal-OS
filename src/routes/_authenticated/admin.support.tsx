/**
 * Atención al Cliente — consulta operativa sobre la misma base que Administración.
 * Shared: CustomerDirectoryService (no duplicate customer store).
 * Communications / campaigns: architecture catalog only (no external integrations).
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFmt } from "@/i18n/localization-provider";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CustomerDirectoryService,
  COMMUNICATION_ENGINE_STAGES,
  PLANNED_CAMPAIGN_KINDS,
  PLANNED_COMMUNICATION_CHANNELS,
  type CustomerOrderSummary,
  type IndividualCustomerRecord,
  type SupportNoteRecord,
  type SupportStats,
} from "@/modules/customer-directory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SupportSearch = {
  customerId?: string;
};

export const Route = createFileRoute("/_authenticated/admin/support")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "support.read");
  },
  validateSearch: (search: Record<string, unknown>): SupportSearch => ({
    customerId:
      typeof search.customerId === "string" ? search.customerId : undefined,
  }),
  component: AdminSupportPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Atención al Cliente" },
      {
        name: "description",
        content:
          "Consulta de clientes, pedidos e incidencias — mismo directorio que Administración.",
      },
    ],
  }),
});

function AdminSupportPage() {
  const fmt = useFmt();
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const { customerId: initialCustomerId } = Route.useSearch();

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minOrders, setMinOrders] = useState("");
  const [customers, setCustomers] = useState<IndividualCustomerRecord[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCustomerId ?? null,
  );
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [notes, setNotes] = useState<SupportNoteRecord[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteKind, setNoteKind] = useState<SupportNoteRecord["kind"]>("note");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [panel, setPanel] = useState<"directory" | "comms">("directory");

  const reloadDirectory = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const [rows, s] = await Promise.all([
        CustomerDirectoryService.listIndividuals(ctx, {
          query,
          kind:
            kindFilter === "all"
              ? "all"
              : (kindFilter as "individual" | "company_employee"),
          status:
            statusFilter === "all"
              ? "all"
              : (statusFilter as "active" | "inactive" | "new"),
          minOrders: minOrders ? Number(minOrders) : null,
        }),
        CustomerDirectoryService.supportStats(ctx),
      ]);
      setCustomers(rows);
      setStats(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, query, kindFilter, statusFilter, minOrders]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      reloadDirectory().catch(() => undefined);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [reloadDirectory]);

  useEffect(() => {
    if (initialCustomerId) setSelectedId(initialCustomerId);
  }, [initialCustomerId]);

  const selected = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? null,
    [customers, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadDetail() {
      if (!user || !tenantId || !selectedId) {
        setOrders([]);
        setNotes([]);
        return;
      }
      setDetailLoading(true);
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const [o, n] = await Promise.all([
          CustomerDirectoryService.getCustomerOrders(ctx, selectedId),
          CustomerDirectoryService.listSupportNotes(ctx, selectedId),
        ]);
        if (!cancelled) {
          setOrders(o);
          setNotes(n);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles, selectedId]);

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId || !selectedId || !can("support.write")) return;
    setSavingNote(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CustomerDirectoryService.addSupportNote(ctx, {
        customerId: selectedId,
        kind: noteKind,
        body: noteBody,
      });
      setNoteBody("");
      toast.success("Nota guardada");
      const n = await CustomerDirectoryService.listSupportNotes(ctx, selectedId);
      setNotes(n);
      await reloadDirectory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingNote(false);
    }
  }

  const columns: Column<IndividualCustomerRecord>[] = [
    {
      key: "name",
      header: "Cliente",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedId(r.id)}
          className={cn(
            "text-left min-w-0 w-full",
            selectedId === r.id && "text-primary",
          )}
        >
          <p className="font-semibold truncate">
            {r.displayName || "Sin nombre"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {r.email || r.phone || r.id.slice(0, 8)}
          </p>
        </button>
      ),
    },
    {
      key: "kind",
      header: "Tipo",
      render: (r) => (
        <span className="text-xs">
          {r.kind === "company_employee" ? "Empleado" : "Particular"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <StatusChip
          tone={
            r.status === "active"
              ? "positive"
              : r.status === "new"
                ? "warning"
                : "danger"
          }
          label={r.status}
        />
      ),
    },
    {
      key: "orders",
      header: "Pedidos",
      className: "text-right",
      render: (r) => (
        <span className="font-mono tabular-nums">{r.orderCount}</span>
      ),
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
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="Atención al Cliente"
        title="Centro de consulta"
        subtitle="Misma base que Administración. Dominio evolutivo: Customer Success (fidelizar · comunicar · recuperar · analizar)."
      />
      <AdminHeader
        goal="Resolver consultas con historial real"
        capability="support.read"
        object="Customer · Order · SupportNote"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPanel("directory")}
          className={cn(
            "h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest border",
            panel === "directory"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border",
          )}
        >
          Directorio
        </button>
        <button
          type="button"
          onClick={() => setPanel("comms")}
          className={cn(
            "h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest border",
            panel === "comms"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border",
          )}
        >
          Comunicaciones (modelo)
        </button>
      </div>

      {panel === "comms" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
              Motor común
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Communication → Channel → Recipient → Template → Campaign →
              Delivery → Result. Sin integraciones externas todavía.
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              {COMMUNICATION_ENGINE_STAGES.map((stage) => (
                <li key={stage}>{stage}</li>
              ))}
            </ol>
          </PanelCard>
          <PanelCard>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
              Canales planificados
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cualquier canal futuro usa el mismo motor. Audience = Customer
              Directory.
            </p>
            <ul className="space-y-2">
              {PLANNED_COMMUNICATION_CHANNELS.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between text-sm border-b border-border/60 py-2"
                >
                  <span>{c.label}</span>
                  <StatusChip tone="warning" label="Pendiente" />
                </li>
              ))}
            </ul>
          </PanelCard>
          <PanelCard className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
              Campañas soportadas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Segmentación reutiliza filtros del directorio compartido.
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {PLANNED_CAMPAIGN_KINDS.map((c) => (
                <li key={c.id} className="text-sm py-1">
                  {c.label}
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      ) : (
        <>
          {stats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <KpiCard label="Activos" value={String(stats.activeCustomers)} />
              <KpiCard
                label="Inactivos"
                value={String(stats.inactiveCustomers)}
              />
              <KpiCard
                label="Recurrentes"
                value={String(stats.recurringCustomers)}
              />
              <KpiCard
                label="Empresas activas"
                value={String(stats.activeCompanies)}
              />
              <KpiCard
                label="Empresas sin pedidos"
                value={String(stats.companiesWithoutOrders)}
              />
              <KpiCard
                label="Incidencias abiertas"
                value={String(stats.openIncidents)}
              />
              <KpiCard
                label="Pedidos pendientes"
                value={String(stats.pendingOrders)}
              />
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <PanelCard>
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cliente, empresa, ciudad…"
                  className="flex-1 min-w-[180px] h-10 rounded-xl border border-border bg-card px-3 text-sm"
                />
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold uppercase tracking-widest"
                >
                  <option value="all">Todos</option>
                  <option value="individual">Particulares</option>
                  <option value="company_employee">Empleados</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold uppercase tracking-widest"
                >
                  <option value="all">Estado</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="new">Nuevos</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={minOrders}
                  onChange={(e) => setMinOrders(e.target.value)}
                  placeholder="Mín. pedidos"
                  className="w-28 h-10 rounded-xl border border-border bg-card px-3 text-sm"
                />
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Cargando…
                </p>
              ) : (
                <DataTable
                  columns={columns}
                  rows={customers}
                  empty="Ningún cliente coincide con la segmentación."
                />
              )}
            </PanelCard>

            <div className="space-y-4">
              <PanelCard>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                  Ficha
                </h3>
                {!selectedId ? (
                  <p className="text-sm text-muted-foreground">
                    Selecciona un cliente del directorio.
                  </p>
                ) : detailLoading && !selected ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-base">
                      {selected?.displayName || "Cliente"}
                    </p>
                    <p className="text-muted-foreground">
                      {selected?.email || "Sin correo"}
                    </p>
                    <p className="text-muted-foreground">
                      {selected?.phone || "Sin teléfono"}
                    </p>
                    {selected?.companyName ? (
                      <p>
                        Empresa:{" "}
                        <span className="font-medium">
                          {selected.companyName}
                        </span>{" "}
                        ({selected.companyCode})
                      </p>
                    ) : null}
                    <p>
                      Ticket medio:{" "}
                      {fmt.currency(selected?.averageTicket ?? 0, {
                        currency: "EUR",
                      })}
                    </p>
                    <p>
                      Alta:{" "}
                      {selected?.createdAt
                        ? fmt.date(selected.createdAt, "medium")
                        : "—"}
                    </p>
                  </div>
                )}
              </PanelCard>

              <PanelCard>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                  Pedidos / historial
                </h3>
                {!selectedId ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pedidos.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-auto">
                    {orders.map((o) => (
                      <li
                        key={o.id}
                        className="flex justify-between text-sm gap-2 border-b border-border/50 py-1"
                      >
                        <span className="truncate">
                          {fmt.date(o.createdAt, "short")} · {o.status}
                        </span>
                        <span className="font-mono tabular-nums shrink-0">
                          {fmt.currency(o.total, { currency: "EUR" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </PanelCard>

              <PanelCard>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                  Incidencias / notas
                </h3>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">
                    Sin notas.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-auto mb-3">
                    {notes.map((n) => (
                      <li key={n.id} className="text-sm border-b border-border/50 py-2">
                        <span className="meta-label">{n.kind}</span>
                        <p className="mt-1">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fmt.date(n.createdAt, "medium")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {can("support.write") && selectedId ? (
                  <form onSubmit={saveNote} className="space-y-3">
                    <div>
                      <Label htmlFor="note-kind">Tipo</Label>
                      <select
                        id="note-kind"
                        value={noteKind}
                        onChange={(e) =>
                          setNoteKind(
                            e.target.value as SupportNoteRecord["kind"],
                          )
                        }
                        className="mt-1 w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
                      >
                        <option value="note">Nota</option>
                        <option value="incident">Incidencia</option>
                        <option value="complaint">Queja</option>
                        <option value="request">Solicitud</option>
                        <option value="allergy_update">Alergia</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="note-body">Contenido</Label>
                      <Input
                        id="note-body"
                        value={noteBody}
                        onChange={(e) => setNoteBody(e.target.value)}
                        placeholder="Qué ocurrió / qué se acordó…"
                        className="mt-1"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={savingNote || !noteBody.trim()}>
                      {savingNote ? "Guardando…" : "Guardar nota"}
                    </Button>
                  </form>
                ) : null}
              </PanelCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
