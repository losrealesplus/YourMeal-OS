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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCompanyAdmin,
  disableCompanyAdmin,
  listCompanyAdmins,
  listTenants,
  resetCompanyAdminInvitation,
} from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/company-admin")({
  component: SaasCompanyAdminPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Company Admins" },
      { name: "description", content: "Provision Company Admin users per tenant." },
    ],
  }),
});

type AdminRow = {
  userId: string;
  tenantId: string | null;
  tenantName: string | null;
  fullName: string | null;
  email: string | null;
  createdAt: string;
};

function SaasCompanyAdminPage() {
  const fetchAdmins = useServerFn(listCompanyAdmins);
  const fetchTenants = useServerFn(listTenants);
  const doCreate = useServerFn(createCompanyAdmin);
  const doDisable = useServerFn(disableCompanyAdmin);
  const doReset = useServerFn(resetCompanyAdminInvitation);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenantId: "", email: "", fullName: "" });

  const admins = useQuery({ queryKey: ["saas", "admins"], queryFn: () => fetchAdmins() });
  const tenants = useQuery({ queryKey: ["saas", "tenants"], queryFn: () => fetchTenants() });

  const create = useMutation({
    mutationFn: async () =>
      doCreate({
        data: {
          tenantId: form.tenantId,
          email: form.email,
          fullName: form.fullName || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Company Admin provisioned");
      setOpen(false);
      setForm({ tenantId: "", email: "", fullName: "" });
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const disable = useMutation({
    mutationFn: (r: AdminRow) =>
      doDisable({ data: { userId: r.userId, tenantId: r.tenantId! } }),
    onSuccess: () => {
      toast.success("Company Admin disabled");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const reset = useMutation({
    mutationFn: (r: AdminRow) => doReset({ data: { email: r.email! } }),
    onSuccess: () => toast.success("Invitation resent"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const columns: Column<AdminRow>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.fullName ?? r.email ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (r) => <StatusChip tone="neutral" label={r.tenantName ?? "—"} />,
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusChip tone="positive" label="active" />,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={!r.email || reset.isPending}
            onClick={() => reset.mutate(r)}
          >
            Reset invite
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!r.tenantId || disable.isPending}
            onClick={() => disable.mutate(r)}
          >
            Disable
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="WP-5 · Provisioning"
        title="Company Admins"
        subtitle="Bootstrap a tenant by inviting its first administrator."
      />
      <AdminHeader
        goal="Enable tenant to self-manage"
        capability="saas.manage"
        object="CompanyAdmin · Membership"
      />
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Invite Company Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Company Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tenant</Label>
                <Select
                  value={form.tenantId}
                  onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tenants.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label>Full name (optional)</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                RI-001: a user belongs to exactly one tenant. Existing memberships block the invite.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={
                  create.isPending || !form.tenantId || !/^[^@]+@[^@]+$/.test(form.email)
                }
              >
                {create.isPending ? "Sending…" : "Send invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PanelCard>
        {admins.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={(admins.data ?? []) as AdminRow[]}
            empty="No Company Admins provisioned yet."
          />
        )}
      </PanelCard>
    </div>
  );
}
