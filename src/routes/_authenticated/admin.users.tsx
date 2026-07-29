/**
 * ADMIN · Usuarios — provisionamiento + aprobación + asignación de rol.
 * Create ≠ access: Identity → Membership(Pending) → Approve → Role → Workspace
 * Capabilities: users.create · employee.manage
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
import { STAFF_INVITE_ROLES } from "@/lib/tenant-admin.functions";
import {
  provisionTenantUser,
  approveTenantMembership,
  assignTenantRole,
  transitionTenantMembership,
  listUserIdentityTimeline,
  ASSIGNABLE_ROLES,
  MEMBERSHIP_TYPES,
} from "@/lib/user-provisioning.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/hooks/use-can";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, ["employee.manage", "users.create"]);
  },
  component: AdminUsersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Usuarios" },
      {
        name: "description",
        content: "Provisionamiento de usuarios · Membership · Roles RBAC.",
      },
    ],
  }),
});

type UserRow = {
  id: string;
  membershipId: string | null;
  fullName: string | null;
  email: string | null;
  roles: string[];
  joinedAt: string | null;
  membershipStatus: string;
  membershipType: string;
};

type TimelineItem = {
  id: string;
  eventType: string;
  label: string;
  performedBy: string | null;
  performedAt: string;
  membershipId: string | null;
  metadata: Record<string, unknown>;
};

const TYPE_LABELS: Record<string, string> = {
  customer: "Cliente",
  employee: "Empleado",
  supplier: "Proveedor",
  company: "Cliente Empresa",
  company_employee: "Empleado Empresa",
};

function AdminUsersPage() {
  const { tenantId } = useAuth();
  const { can: canCap } = useCan();
  const canCreate = canCap("users.create");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipType, setMembershipType] =
    useState<(typeof MEMBERSHIP_TYPES)[number]>("employee");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [intendedRole, setIntendedRole] = useState<
    (typeof STAFF_INVITE_ROLES)[number] | ""
  >("");
  const [channel, setChannel] = useState<"provisioning" | "invitation">(
    "provisioning",
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const doProvision = useServerFn(provisionTenantUser);
  const doApprove = useServerFn(approveTenantMembership);
  const doAssign = useServerFn(assignTenantRole);
  const doTransition = useServerFn(transitionTenantMembership);
  const doTimeline = useServerFn(listUserIdentityTimeline);

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const db = supabase as any;
      const { data: members, error: mErr } = await db
        .from("tenant_members")
        .select(
          "id, user_id, joined_at, status, membership_type, created_at, deleted_at",
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);
      if (mErr) throw mErr;
      const memberRows = (members ?? []) as Array<{
        id?: string;
        user_id: string;
        joined_at: string;
        status?: string;
        membership_type?: string;
        created_at?: string;
      }>;
      const ids = memberRows.map((m) => m.user_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        db.from("profiles").select("id, full_name, first_name, last_name").in("id", ids),
        db
          .from("user_roles")
          .select("user_id, role")
          .eq("tenant_id", tenantId)
          .in("user_id", ids),
      ]);

      const profileMap = new Map(
        (
          (profiles ?? []) as Array<{
            id: string;
            full_name: string | null;
            first_name?: string | null;
            last_name?: string | null;
          }>
        ).map((p) => [
          p.id,
          p.full_name ||
            [p.first_name, p.last_name].filter(Boolean).join(" ") ||
            null,
        ]),
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
          membershipId: m.id ?? null,
          fullName: profileMap.get(m.user_id) ?? null,
          email: null,
          roles: rolesMap.get(m.user_id) ?? [],
          joinedAt: m.created_at ?? m.joined_at,
          membershipStatus: m.status ?? "approved",
          membershipType: m.membership_type ?? "employee",
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

  const provision = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Missing tenant");
      return doProvision({
        data: {
          tenantId,
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          membershipType,
          channel,
          department: department.trim() || undefined,
          position: position.trim() || undefined,
          notes: notes.trim() || undefined,
          intendedRole: intendedRole || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success(
        "Usuario provisionado · Membership Pending (sin acceso hasta Approve + Role)",
      );
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setDepartment("");
      setPosition("");
      setNotes("");
      setIntendedRole("");
      load();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : String(e));
    },
  });

  const approve = useMutation({
    mutationFn: async (userId: string) => {
      if (!tenantId) throw new Error("Missing tenant");
      return doApprove({
        data: {
          tenantId,
          userId,
          // Role remains optional and explicit — not automatic on create
          assignRole: undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Membership Approved — asigna un Role para conceder acceso");
      load();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const assign = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: (typeof ASSIGNABLE_ROLES)[number];
    }) => {
      if (!tenantId) throw new Error("Missing tenant");
      return doAssign({ data: { tenantId, userId, role } });
    },
    onSuccess: () => {
      toast.success("Role asignado · acceso efectivo concedido");
      load();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  async function loadTimeline(userId: string) {
    if (!tenantId) return;
    setSelectedUserId(userId);
    setTimelineLoading(true);
    try {
      const items = await doTimeline({
        data: { tenantId, userId, limit: 40 },
      });
      setTimeline(items as TimelineItem[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setTimelineLoading(false);
    }
  }

  const transition = useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: "suspend" | "reactivate" | "revoke" | "reject";
    }) => {
      if (!tenantId) throw new Error("Missing tenant");
      return doTransition({ data: { tenantId, userId, action } });
    },
    onSuccess: (_data, vars) => {
      toast.success(`Membership · ${vars.action}`);
      load();
      if (selectedUserId) loadTimeline(selectedUserId);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
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
      key: "type",
      header: "Tipo",
      render: (r) => (
        <StatusChip
          tone="neutral"
          label={TYPE_LABELS[r.membershipType] ?? r.membershipType}
        />
      ),
    },
    {
      key: "status",
      header: "Membership",
      render: (r) => {
        const tone =
          r.membershipStatus === "approved"
            ? "positive"
            : r.membershipStatus === "pending"
              ? "warning"
              : "danger";
        return (
          <StatusChip
            tone={tone as "positive" | "warning" | "danger"}
            label={r.membershipStatus}
          />
        );
      },
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
      key: "actions",
      header: "Acciones",
      render: (r) => (
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadTimeline(r.id)}
          >
            Timeline
          </Button>
          {r.membershipStatus === "pending" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={approve.isPending}
              onClick={() => approve.mutate(r.id)}
            >
              Aprobar
            </Button>
          )}
          {r.membershipStatus === "approved" && r.roles.length === 0 && (
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              defaultValue=""
              onChange={(e) => {
                const role = e.target.value as (typeof ASSIGNABLE_ROLES)[number];
                if (!role) return;
                assign.mutate({ userId: r.id, role });
              }}
            >
              <option value="">Asignar role…</option>
              {ASSIGNABLE_ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          )}
          {r.membershipStatus === "approved" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={transition.isPending}
              onClick={() =>
                transition.mutate({ userId: r.id, action: "suspend" })
              }
            >
              Suspender
            </Button>
          )}
          {r.membershipStatus === "suspended" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={transition.isPending}
              onClick={() =>
                transition.mutate({ userId: r.id, action: "reactivate" })
              }
            >
              Reactivar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <SectionTitle
        overline="Administración"
        title="Usuarios"
        subtitle="Provisionamiento · Membership · Role · Timeline. Crear usuario no concede acceso."
      />
      <AdminHeader
        goal="Incorporar personas al tenant sin saltarse RBAC"
        capability="users.create · employee.manage"
        object="Identity · Profile · Membership · Role"
      />

      {canCreate && (
        <PanelCard>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Nuevo usuario
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Canales: Provisioning o Invitation. El membership queda Pending; el
            acceso requiere Approve + Role.
          </p>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              provision.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="user-channel">Canal</Label>
              <select
                id="user-channel"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as "provisioning" | "invitation")
                }
              >
                <option value="provisioning">Provisioning</option>
                <option value="invitation">Invitation</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-type">Tipo</Label>
              <select
                id="user-type"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={membershipType}
                onChange={(e) =>
                  setMembershipType(
                    e.target.value as (typeof MEMBERSHIP_TYPES)[number],
                  )
                }
              >
                {MEMBERSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-first">Nombre</Label>
              <Input
                id="user-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-last">Apellidos</Label>
              <Input
                id="user-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {(membershipType === "employee" ||
              membershipType === "company_employee") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="user-dept">Departamento</Label>
                  <Input
                    id="user-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-pos">Cargo</Label>
                  <Input
                    id="user-pos"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="user-intended-role">
                Role previsto (opcional · no se asigna aún)
              </Label>
              <select
                id="user-intended-role"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={intendedRole}
                onChange={(e) =>
                  setIntendedRole(
                    e.target.value as (typeof STAFF_INVITE_ROLES)[number] | "",
                  )
                }
              >
                <option value="">— ninguno —</option>
                {STAFF_INVITE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="user-notes">Notas internas</Label>
              <Input
                id="user-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" disabled={provision.isPending}>
                {channel === "invitation"
                  ? "Enviar invitación"
                  : "Provisionar usuario"}
              </Button>
            </div>
          </form>
        </PanelCard>
      )}

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

      <PanelCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Activity Timeline
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Historial de negocio Identity · Membership · Role (no es log técnico).
          {selectedUserId
            ? ` Usuario ${selectedUserId.slice(0, 8)}…`
            : " Selecciona Timeline en un usuario."}
        </p>
        {!selectedUserId ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sin usuario seleccionado.
          </p>
        ) : timelineLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Cargando timeline…
          </p>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sin eventos todavía.
          </p>
        ) : (
          <ol className="space-y-3 border-l border-border pl-4">
            {timeline.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-primary" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(item.performedAt).toLocaleString("es-ES")}
                </p>
                <p className="text-sm font-medium">{item.label}</p>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {JSON.stringify(item.metadata)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </PanelCard>
    </div>
  );
}
