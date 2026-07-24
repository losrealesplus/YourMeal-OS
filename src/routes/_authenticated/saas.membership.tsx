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
import { listMemberships } from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/membership")({
  component: SaasMembershipPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Membership" },
      { name: "description", content: "RI-001 membership model: 1 user → 1 tenant." },
    ],
  }),
});

type Row = {
  userId: string;
  tenantId: string;
  tenantName: string;
  fullName: string | null;
  roles: string[];
  joinedAt: string;
};

function SaasMembershipPage() {
  const fetch = useServerFn(listMemberships);
  const q = useQuery({ queryKey: ["saas", "members"], queryFn: () => fetch() });

  const dupes = new Map<string, number>();
  for (const r of q.data ?? []) {
    dupes.set(r.userId, (dupes.get(r.userId) ?? 0) + 1);
  }

  const columns: Column<Row>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.fullName ?? "—"}</p>
          <p className="text-xs text-muted-foreground font-mono">{r.userId.slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (r) => <StatusChip tone="neutral" label={r.tenantName} />,
    },
    {
      key: "roles",
      header: "Roles",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.length === 0 ? (
            <StatusChip tone="warning" label="no role" />
          ) : (
            r.roles.map((role) => <StatusChip key={role} tone="neutral" label={role} />)
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        (dupes.get(r.userId) ?? 0) > 1 ? (
          <StatusChip tone="danger" label="multi-tenant (RI-001 breach)" />
        ) : (
          <StatusChip tone="success" label="active" />
        ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.joinedAt).toLocaleDateString("es-ES")}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="RI-001"
        title="Membership"
        subtitle="A user belongs to exactly one tenant. Duplicates surface as breaches."
      />
      <AdminHeader
        goal="Enforce single-tenant membership"
        capability="saas.manage"
        object="TenantMember"
      />
      <PanelCard>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={(q.data ?? []) as Row[]}
            empty="No memberships yet."
          />
        )}
      </PanelCard>
    </div>
  );
}
