/**
 * ADMIN · Auditoría — lectura real de audit_log del tenant.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AdminHeader,
  DataTable,
  PanelCard,
  SectionTitle,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { useAuth } from "@/hooks/use-auth";
import { useFmt } from "@/i18n/localization-provider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") || roles.includes("company_admin");
    if (!allowed) throw redirect({ to: "/admin" });
  },
  component: AdminAuditPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Auditoría" },
      { name: "description", content: "Registro de cambios del tenant." },
    ],
  }),
});

type AuditRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  createdAt: string;
};

function AdminAuditPage() {
  const { tenantId } = useAuth();
  const fmt = useFmt();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!tenantId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("audit_log")
          .select("id, entity_type, entity_id, action, actor_id, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const mapped = ((data ?? []) as Array<{
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_id: string | null;
          created_at: string;
        }>).map((r) => ({
          id: r.id,
          entityType: r.entity_type,
          entityId: r.entity_id,
          action: r.action,
          actorId: r.actor_id,
          createdAt: r.created_at,
        }));
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const columns: Column<AuditRow>[] = [
    {
      key: "when",
      header: "Cuándo",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {fmt.date(r.createdAt, "medium")}
        </span>
      ),
    },
    {
      key: "action",
      header: "Acción",
      render: (r) => (
        <span className="text-xs font-bold uppercase tracking-widest">
          {r.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Entidad",
      render: (r) => (
        <span className="text-sm">
          {r.entityType}{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {r.entityId.slice(0, 8)}…
          </span>
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.actorId ? `${r.actorId.slice(0, 8)}…` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="Administración"
        title="Auditoría"
        subtitle="Últimos 100 eventos persistidos en audit_log."
      />
      <AdminHeader
        goal="Trazabilidad de cambios operativos"
        capability="admin.settings"
        object="AuditLog"
      />
      <PanelCard>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Cargando…
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty="Sin eventos de auditoría todavía."
          />
        )}
      </PanelCard>
    </div>
  );
}
