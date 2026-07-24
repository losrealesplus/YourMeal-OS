import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SectionTitle, KpiCard, PanelCard } from "@/components/admin";
import {
  listTenants,
  listCompanyAdmins,
  listMemberships,
  listProvisioningAudit,
} from "@/lib/saas-admin.functions";

export const Route = createFileRoute("/_authenticated/saas/")({
  component: SaasOverview,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Platform Overview" },
      { name: "description", content: "Platform governance overview." },
    ],
  }),
});

function SaasOverview() {
  const fetchTenants = useServerFn(listTenants);
  const fetchAdmins = useServerFn(listCompanyAdmins);
  const fetchMembers = useServerFn(listMemberships);
  const fetchAudit = useServerFn(listProvisioningAudit);

  const tenants = useQuery({ queryKey: ["saas", "tenants"], queryFn: () => fetchTenants() });
  const admins = useQuery({ queryKey: ["saas", "admins"], queryFn: () => fetchAdmins() });
  const members = useQuery({ queryKey: ["saas", "members"], queryFn: () => fetchMembers() });
  const audit = useQuery({ queryKey: ["saas", "audit"], queryFn: () => fetchAudit() });

  const activeTenants =
    tenants.data?.filter((t) => t.status === "active").length ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        overline="Platform"
        title="Governance Overview"
        subtitle="Tenants, company admins, memberships and provisioning events."
      />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tenants" value={String(tenants.data?.length ?? 0)} hint={`${activeTenants} active`} />
        <KpiCard label="Company Admins" value={String(admins.data?.length ?? 0)} />
        <KpiCard label="Memberships" value={String(members.data?.length ?? 0)} />
        <KpiCard label="Provisioning events" value={String(audit.data?.length ?? 0)} />
      </div>
      <PanelCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/saas/tenants" className="rounded-xl border border-border p-4 hover:bg-secondary/60">
            <p className="meta-label">WP-5</p>
            <p className="font-semibold mt-1">Tenants</p>
            <p className="text-xs text-muted-foreground mt-1">List · create · activate</p>
          </Link>
          <Link to="/saas/company-admin" className="rounded-xl border border-border p-4 hover:bg-secondary/60">
            <p className="meta-label">Provisioning</p>
            <p className="font-semibold mt-1">Company Admins</p>
            <p className="text-xs text-muted-foreground mt-1">Invite · disable · reset</p>
          </Link>
          <Link to="/saas/membership" className="rounded-xl border border-border p-4 hover:bg-secondary/60">
            <p className="meta-label">RI-001</p>
            <p className="font-semibold mt-1">Membership</p>
            <p className="text-xs text-muted-foreground mt-1">1 user → 1 tenant</p>
          </Link>
          <Link to="/saas/audit" className="rounded-xl border border-border p-4 hover:bg-secondary/60">
            <p className="meta-label">Trace</p>
            <p className="font-semibold mt-1">Provisioning audit</p>
            <p className="text-xs text-muted-foreground mt-1">Every governance action</p>
          </Link>
        </div>
      </PanelCard>
    </div>
  );
}
