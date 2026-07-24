import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  AdminHeader,
  DataTable,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { useFmt } from "@/i18n/localization-provider";
import { listProvisioningAudit } from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/audit")({
  component: SaasAuditPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Provisioning Audit" },
      { name: "description", content: "Provisioning events across the platform." },
    ],
  }),
});

type Row = {
  id: string;
  tenant_id: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  new_data: unknown;
  created_at: string;
};

const TONE: Record<string, "positive" | "warning" | "danger" | "neutral"> = {
  TENANT_CREATED: "positive",
  TENANT_ACTIVATED: "positive",
  TENANT_STATUS_CHANGED: "warning",
  COMPANY_ADMIN_CREATED: "positive",
  MEMBERSHIP_ASSIGNED: "positive",
  ROLE_CHANGED: "neutral",
};

function SaasAuditPage() {
  const fmt = useFmt();
  const fetch = useServerFn(listProvisioningAudit);
  const q = useQuery({ queryKey: ["saas", "audit"], queryFn: () => fetch() });

  const columns: Column<Row>[] = [
    {
      key: "when",
      header: "When",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {fmt.date(r.created_at, "medium")}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <StatusChip tone={TONE[r.action] ?? "neutral"} label={r.action} />
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (r) => (
        <span className="text-sm">
          {r.entity_type}{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {r.entity_id.slice(0, 8)}…
          </span>
        </span>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.tenant_id ? `${r.tenant_id.slice(0, 8)}…` : "—"}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.actor_id ? `${r.actor_id.slice(0, 8)}…` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="Trace"
        title="Provisioning Audit"
        subtitle="Every governance action: tenant, company admin, membership, role."
      />
      <AdminHeader
        goal="Traceability of platform provisioning"
        capability="saas.manage"
        object="AuditLog"
      />
      <PanelCard>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={(q.data ?? []) as Row[]}
            empty="No provisioning events yet."
          />
        )}
      </PanelCard>
    </div>
  );
}
