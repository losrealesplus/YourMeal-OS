/**
 * ADMIN · Usuarios — listado real de miembros del tenant + roles (RBAC).
 * Capability: admin.settings / saas.manage / company_admin
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") || roles.includes("company_admin");
    if (!allowed) throw redirect({ to: "/admin" });
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

  useEffect(() => {
    let cancelled = false;
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
          if (!cancelled) setRows([]);
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

        const built: UserRow[] = memberRows.map((m) => ({
          id: m.user_id,
          fullName: profileMap.get(m.user_id) ?? null,
          email: null,
          roles: rolesMap.get(m.user_id) ?? [],
          joinedAt: m.joined_at,
        }));
        if (!cancelled) setRows(built);
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
            {r.roles.map((role) => (
              <StatusChip key={role} tone="neutral" label={role} />
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
    <div className="animate-fade-in">
      <SectionTitle
        overline="Administración"
        title="Usuarios"
        subtitle="Miembros del tenant y roles. Alta/baja de roles vía procesos staff (sin bypass)."
      />
      <AdminHeader
        goal="Ver quién opera en EatClean"
        capability="admin.settings"
        object="TenantMember · UserRole"
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
            empty="No hay miembros en este tenant."
          />
        )}
      </PanelCard>
    </div>
  );
}
