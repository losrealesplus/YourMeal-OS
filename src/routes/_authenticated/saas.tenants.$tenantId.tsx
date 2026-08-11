import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getTenant,
  listTenantDeployments,
  setTenantStatus,
  upsertTenantDeployment,
} from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/tenants/$tenantId")({
  component: SaasTenantDetailPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Tenant detail" },
      { name: "description", content: "Tenant provisioning detail." },
    ],
  }),
});

type Member = {
  id: string;
  userId: string;
  fullName: string | null;
  roles: string[];
  joinedAt: string;
};

type DeploymentRow = {
  id: string;
  tenant_id: string;
  platform: string;
  identifier: string;
  is_primary: boolean;
  status: string;
};

function SaasTenantDetailPage() {
  const { tenantId } = Route.useParams();
  const fetchTenant = useServerFn(getTenant);
  const fetchDeployments = useServerFn(listTenantDeployments);
  const doStatus = useServerFn(setTenantStatus);
  const doUpsertDeployment = useServerFn(upsertTenantDeployment);
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<"android" | "ios" | "web">("android");
  const [identifier, setIdentifier] = useState("");

  const q = useQuery({
    queryKey: ["saas", "tenant", tenantId],
    queryFn: () => fetchTenant({ data: { tenantId } }),
  });

  const deploymentsQ = useQuery({
    queryKey: ["saas", "tenant", tenantId, "deployments"],
    queryFn: () => fetchDeployments({ data: { tenantId } }),
  });

  const status = useMutation({
    mutationFn: (v: "active" | "suspended") =>
      doStatus({ data: { tenantId, status: v } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : String(e)),
  });

  const upsertDeployment = useMutation({
    mutationFn: () =>
      doUpsertDeployment({
        data: {
          tenantId,
          platform,
          identifier,
          isPrimary: true,
        },
      }),
    onSuccess: () => {
      toast.success("Deployment bound");
      setIdentifier("");
      qc.invalidateQueries({
        queryKey: ["saas", "tenant", tenantId, "deployments"],
      });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (q.isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data)
    return <p className="text-sm text-destructive">Tenant not found.</p>;

  const t = q.data.tenant;
  const members = q.data.members;
  const deployments = (deploymentsQ.data ?? []) as DeploymentRow[];

  const memberCols: Column<Member>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.fullName ?? "—"}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {r.userId.slice(0, 8)}…
          </p>
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

  const deploymentCols: Column<DeploymentRow>[] = [
    {
      key: "platform",
      header: "Platform",
      render: (r) => <span className="font-mono text-xs">{r.platform}</span>,
    },
    {
      key: "identifier",
      header: "Identifier",
      render: (r) => (
        <span className="font-mono text-xs">{r.identifier}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          tone={r.status === "active" ? "positive" : "neutral"}
          label={r.status}
        />
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
                tone={
                  t.status === "active"
                    ? "positive"
                    : t.status === "suspended"
                      ? "danger"
                      : "warning"
                }
                label={t.status}
              />
              {t.status !== "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status.mutate("active")}
                >
                  Activate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status.mutate("suspended")}
                >
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
                style={{
                  background: t.brand_primary ?? "hsl(var(--muted))",
                }}
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
        <SectionTitle
          overline="Deployments"
          title="Deployment → Tenant binding"
          subtitle="SaaS-only. Customer never selects Tenant."
        />
        <PanelCard className="space-y-4">
          <DataTable
            columns={deploymentCols}
            rows={deployments}
            empty="No deployments bound yet."
          />
          <div className="grid gap-3 md:grid-cols-[140px_1fr_auto] items-end border-t pt-4">
            <div className="grid gap-1.5">
              <Label htmlFor="dep-platform">Platform</Label>
              <select
                id="dep-platform"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as "android" | "ios" | "web")
                }
              >
                <option value="android">android</option>
                <option value="ios">ios</option>
                <option value="web">web</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dep-id">Identifier</Label>
              <Input
                id="dep-id"
                placeholder="com.yourmealos.eatclean"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <Button
              disabled={!identifier.trim() || upsertDeployment.isPending}
              onClick={() => upsertDeployment.mutate()}
            >
              Bind deployment
            </Button>
          </div>
        </PanelCard>
      </div>

      <div>
        <SectionTitle overline="Members" title={`${members.length} users`} />
        <PanelCard>
          <DataTable
            columns={memberCols}
            rows={(members as Omit<Member, "id">[]).map((m) => ({
              ...m,
              id: m.userId,
            }))}
            empty="No members yet. Invite a Company Admin to bootstrap this tenant."
          />

          <div className="pt-3">
            <Link
              to="/saas/company-admin"
              className="text-xs text-primary hover:underline"
            >
              → Invite a Company Admin
            </Link>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
