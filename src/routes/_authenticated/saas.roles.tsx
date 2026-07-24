import { createFileRoute } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignRole,
  listMemberships,
  listTenants,
  revokeRole,
  ROLE_CATALOG,
} from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/roles")({
  component: SaasRolesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Roles" },
      { name: "description", content: "Assign platform roles to users." },
    ],
  }),
});

type MemberRow = {
  userId: string;
  tenantId: string;
  tenantName: string;
  fullName: string | null;
  roles: string[];
  joinedAt: string;
};

function SaasRolesPage() {
  const fetchMembers = useServerFn(listMemberships);
  const fetchTenants = useServerFn(listTenants);
  const doAssign = useServerFn(assignRole);
  const doRevoke = useServerFn(revokeRole);
  const qc = useQueryClient();

  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});

  const members = useQuery({ queryKey: ["saas", "members"], queryFn: () => fetchMembers() });
  useQuery({ queryKey: ["saas", "tenants"], queryFn: () => fetchTenants() });

  const assign = useMutation({
    mutationFn: (v: { userId: string; tenantId: string; role: string }) =>
      doAssign({
        data: {
          userId: v.userId,
          tenantId: v.tenantId,
          role: v.role as (typeof ROLE_CATALOG)[number],
        },
      }),
    onSuccess: () => {
      toast.success("Role assigned");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const revoke = useMutation({
    mutationFn: (v: { userId: string; tenantId: string; role: string }) =>
      doRevoke({
        data: {
          userId: v.userId,
          tenantId: v.tenantId,
          role: v.role as (typeof ROLE_CATALOG)[number],
        },
      }),
    onSuccess: () => {
      toast.success("Role revoked");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const columns: Column<MemberRow>[] = [
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
            <StatusChip tone="warning" label="none" />
          ) : (
            r.roles.map((role) => (
              <button
                key={role}
                onClick={() =>
                  revoke.mutate({ userId: r.userId, tenantId: r.tenantId, role })
                }
                className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-secondary hover:bg-destructive/20"
                title="Click to revoke"
              >
                {role} ×
              </button>
            ))
          )}
        </div>
      ),
    },
    {
      key: "assign",
      header: "Assign",
      render: (r) => {
        const key = `${r.userId}::${r.tenantId}`;
        const value = roleDraft[key] ?? "";
        return (
          <div className="flex gap-2 justify-end">
            <Select
              value={value}
              onValueChange={(v) => setRoleDraft((d) => ({ ...d, [key]: v }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role…" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CATALOG.filter((role) => !r.roles.includes(role)).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!value || assign.isPending}
              onClick={() =>
                assign.mutate({ userId: r.userId, tenantId: r.tenantId, role: value })
              }
            >
              Assign
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="RBAC"
        title="Roles"
        subtitle="Assign platform roles from the catalog. Permissions are system-defined."
      />
      <AdminHeader
        goal="Control who can operate what"
        capability="saas.manage"
        object="UserRole"
      />
      <PanelCard>
        <div className="mb-4">
          <p className="meta-label">Role catalog</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {ROLE_CATALOG.map((role) => (
              <StatusChip key={role} tone="neutral" label={role} />
            ))}
          </div>
        </div>
        {members.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={(members.data ?? []) as MemberRow[]}
            empty="No memberships yet."
          />
        )}
      </PanelCard>
    </div>
  );
}
