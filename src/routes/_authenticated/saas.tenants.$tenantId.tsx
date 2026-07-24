import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AdminHeader,
  DataTable,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { getTenant, setTenantStatus } from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/tenants/$tenantId")({
  component: SaasTenantDetailPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Tenant detail" },
      { name: "description", content: "Tenant provisioning detail." },
    ],
  }),
});

type Member = { id: string; userId: string; fullName: string | null; roles: string[]; joinedAt: string };

function SaasTenantDetailPage() {
  const { tenantId } = Route.useParams();
  const fetchTenant = useServerFn(getTenant);
  const doStatus = useServerFn(setTenantStatus);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["saas", "tenant", tenantId],
    queryFn: () => fetchTenant({ data: { tenantId } }),
  });

  const status = useMutation({
    mutationFn: (v: "active" | "suspended") => doStatus({ data: { tenantId, status: v } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data)
    return <p className="text-sm text-destructive">Tenant not found.</p>;

  const t = q.data.tenant;
  const members = q.data.members;

  const memberCols: Column<Member>[] = [
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
      key: "roles",
      header: "Roles",
      render: (r) =>
        r.roles.length === 0 ? (
          <StatusChip tone="warning" label="no role" />
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.roles.map((role) => (
              <StatusChip key={role} tone="neutral" label={role} />
            ))}
          </div>
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
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/saas/tenants" className="meta-label hover:underline">
          ← Tenants
        </Link>
        <SectionTitle title={t.name} subtitle={`/${t.slug}`} />
      </div>

      <AdminHeader
        goal="Tenant governance detail"
        capability="saas.manage"
        object="Tenant"
      />

      <PanelCard>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="meta-label">Operational</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusChip
                tone={t.status === "active" ? "positive" : t.status === "suspended" ? "danger" : "warning"}
                label={t.status}
              />
              {t.status !== "active" ? (
                <Button size="sm" variant="outline" onClick={() => status.mutate("active")}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => status.mutate("suspended")}>
                  Deactivate
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="meta-label">Branding</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-block w-5 h-5 rounded border"
                style={{ background: t.brand_primary ?? "hsl(var(--muted))" }}
              />
              <StatusChip
                tone={t.brand_updated_at ? "positive" : "neutral"}
                label={t.brand_updated_at ? "configured" : "default"}
              />
            </div>
          </div>
          <div>
            <p className="meta-label">Locale</p>
            <p className="mt-2 text-sm font-mono">
              {t.locale_default}
              {t.country ? ` · ${t.country}` : ""}
              {t.currency ? ` · ${t.currency}` : ""}
            </p>
          </div>
        </div>
      </PanelCard>

      <div>
        <SectionTitle overline="Members" title={`${members.length} users`} />
        <PanelCard>
          <DataTable
            columns={memberCols}
            rows={(members as Omit<Member, "id">[]).map((m) => ({ ...m, id: m.userId }))}
            empty="No members yet. Invite a Company Admin to bootstrap this tenant."
          />

          <div className="pt-3">
            <Link to="/saas/company-admin" className="text-xs text-primary hover:underline">
              → Invite a Company Admin
            </Link>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
