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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createTenant,
  listTenants,
  setTenantStatus,
} from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/tenants")({
  component: SaasTenantsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Tenants" },
      { name: "description", content: "Manage platform tenants." },
    ],
  }),
});

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  locale_default: string;
  country: string | null;
  currency: string | null;
  brand_primary: string | null;
  brand_logo_path: string | null;
  brand_updated_at: string | null;
  created_at: string;
};

function SaasTenantsPage() {
  const qc = useQueryClient();
  const fetchTenants = useServerFn(listTenants);
  const doCreate = useServerFn(createTenant);
  const doStatus = useServerFn(setTenantStatus);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", country: "", currency: "" });

  const q = useQuery({ queryKey: ["saas", "tenants"], queryFn: () => fetchTenants() });

  const create = useMutation({
    mutationFn: async () =>
      doCreate({
        data: {
          name: form.name,
          slug: form.slug,
          localeDefault: "es",
          country: form.country || undefined,
          currency: form.currency || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Tenant created");
      setOpen(false);
      setForm({ name: "", slug: "", country: "", currency: "" });
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const status = useMutation({
    mutationFn: async (v: { tenantId: string; status: "active" | "suspended" }) =>
      doStatus({ data: v }),
    onSuccess: () => {
      toast.success("Tenant status updated");
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const columns: Column<TenantRow>[] = [
    {
      key: "name",
      header: "Tenant",
      render: (r) => (
        <div>
          <Link
            to="/saas/tenants/$tenantId"
            params={{ tenantId: r.id }}
            className="font-semibold hover:underline"
          >
            {r.name}
          </Link>
          <p className="text-xs text-muted-foreground">/{r.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Operational",
      render: (r) => (
        <StatusChip
          tone={r.status === "active" ? "success" : r.status === "suspended" ? "danger" : "warning"}
          label={r.status}
        />
      ),
    },
    {
      key: "brand",
      header: "Branding",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded"
            style={{ background: r.brand_primary ?? "hsl(var(--muted))" }}
          />
          <StatusChip
            tone={r.brand_updated_at ? "success" : "neutral"}
            label={r.brand_updated_at ? "configured" : "default"}
          />
        </div>
      ),
    },
    {
      key: "locale",
      header: "Locale",
      render: (r) => (
        <span className="text-xs font-mono">
          {r.locale_default}
          {r.country ? ` · ${r.country}` : ""}
          {r.currency ? ` · ${r.currency}` : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2 justify-end">
          {r.status !== "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => status.mutate({ tenantId: r.id, status: "active" })}
              disabled={status.isPending}
            >
              Activate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => status.mutate({ tenantId: r.id, status: "suspended" })}
              disabled={status.isPending}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="WP-5 · Provisioning"
        title="Tenants"
        subtitle="List, create and control operational status of platform tenants."
      />
      <AdminHeader
        goal="Provision tenants ready to operate"
        capability="saas.manage"
        object="Tenant"
      />
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="EatClean Tenerife"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                  }
                  placeholder="eatclean-tenerife"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Country (ISO-2)</Label>
                  <Input
                    value={form.country}
                    maxLength={2}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))
                    }
                    placeholder="ES"
                  />
                </div>
                <div>
                  <Label>Currency (ISO-3)</Label>
                  <Input
                    value={form.currency}
                    maxLength={3}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))
                    }
                    placeholder="EUR"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || form.name.length < 2 || form.slug.length < 2}
              >
                {create.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PanelCard>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <DataTable columns={columns} rows={(q.data ?? []) as TenantRow[]} empty="No tenants yet." />
        )}
      </PanelCard>
    </div>
  );
}
