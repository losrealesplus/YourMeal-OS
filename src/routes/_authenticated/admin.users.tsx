/**
 * ADMIN · Usuarios — listado real + invite staff (OP-001 bootstrap).
 * Capability: employee.manage
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AdminHeader,
  DataTable,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  inviteTenantStaff,
  STAFF_INVITE_ROLES,
} from "@/lib/tenant-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "employee.manage");
  },
  component: AdminUsersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Usuarios" },
      { name: "description", content: "Miembros del tenant y roles RBAC." },
    ],
  }),
});

type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  roles: string[];
  joinedAt: string | null;
};

function AdminUsersPage() {
  const { tenantId } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof STAFF_INVITE_ROLES)[number]>("kitchen");
  const doInvite = useServerFn(inviteTenantStaff);

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const db = supabase as any;
      const { data: members, error: mErr } = await db
        .from("tenant_members")
        .select("user_id, joined_at")
        .eq("tenant_id", tenantId);
      if (mErr) throw mErr;
      const memberRows = (members ?? []) as Array<{
        user_id: string;
        joined_at: string;
      }>;
      const ids = memberRows.map((m) => m.user_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        db.from("profiles").select("id, full_name").in("id", ids),
        db
          .from("user_roles")
          .select("user_id, role")
          .eq("tenant_id", tenantId)
          .in("user_id", ids),
      ]);

      const profileMap = new Map(
        ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map(
          (p) => [p.id, p.full_name],
        ),
      );
      const rolesMap = new Map<string, string[]>();
      for (const r of (roleRows ?? []) as Array<{
        user_id: string;
        role: string;
      }>) {
        const list = rolesMap.get(r.user_id) ?? [];
        list.push(r.role);
        rolesMap.set(r.user_id, list);
      }

      setRows(
        memberRows.map((m) => ({
          id: m.user_id,
          fullName: profileMap.get(m.user_id) ?? null,
          email: null,
          roles: rolesMap.get(m.user_id) ?? [],
          joinedAt: m.joined_at,
        })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const invite = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Missing tenant");
      return doInvite({
        data: {
          tenantId,
          email: email.trim(),
          role,
          fullName: fullName.trim() || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Invitación enviada");
      setEmail("");
      setFullName("");
      load();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : String(e));
    },
  });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Usuario",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.fullName || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {r.id.slice(0, 8)}…
          </p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles / RBAC",
      render: (r) =>
        r.roles.length === 0 ? (
          <StatusChip tone="warning" label="sin rol" />
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.roles.map((roleLabel) => (
              <StatusChip key={roleLabel} tone="neutral" label={roleLabel} />
            ))}
          </div>
        ),
    },
    {
      key: "joined",
      header: "Vinculación",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString("es-ES") : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <SectionTitle
        overline="Administración"
        title="Usuarios"
        subtitle="Miembros del tenant y roles. Invita cocina y reparto sin SQL."
      />
      <AdminHeader
        goal="Dotar de personal operativo"
        capability="employee.manage"
        object="TenantMember · UserRole"
      />

      <PanelCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Invitar staff
        </p>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">Nombre (opcional)</Label>
            <Input
              id="staff-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-role">Rol</Label>
            <select
              id="staff-role"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as (typeof STAFF_INVITE_ROLES)[number])
              }
            >
              {STAFF_INVITE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={invite.isPending}>
              Enviar invitación
            </Button>
          </div>
        </form>
      </PanelCard>

      <PanelCard>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Cargando…
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty="No hay miembros en este tenant."
          />
        )}
      </PanelCard>
    </div>
  );
}
