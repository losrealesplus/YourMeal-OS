/**
 * Company Portal — Company Account admin (ADR 0015).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Network, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CompanyAccountService,
  type CompanyAccount,
  type EmployeeMembership,
} from "@/modules/company-account";
import { ScreenHeader } from "@/components/consumer";

export const Route = createFileRoute("/_authenticated/app/company")({
  component: CompanyPortalPage,
});

function CompanyPortalPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user, tenantId, roles } = useAuth();
  const [company, setCompany] = useState<CompanyAccount | null>(null);
  const [membership, setMembership] = useState<EmployeeMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !tenantId) {
        setLoading(false);
        return;
      }
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const bound = await CompanyAccountService.getMembershipForUser(ctx);
        if (cancelled) return;
        if (!bound) {
          setCompany(null);
          setMembership(null);
        } else {
          setCompany(bound.company);
          setMembership(bound.membership);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles]);

  if (loading) {
    return <div className="flex-1" aria-busy="true" />;
  }

  if (!company || !membership) {
    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader
          backTo="/app"
          title={t("customer:companyPortal", { defaultValue: "Mi empresa" })}
        />
        <div className="px-6 text-sm text-muted-foreground">
          {t("customer:noCompanyMembership", {
            defaultValue:
              "Aún no perteneces a una empresa. Únete con el Company Code que te facilite EatClean o tu empresa. El alta de empresas la realiza EatClean (no hay registro público).",
          })}
          <div className="mt-4 space-y-2">
            <Link className="text-primary font-semibold underline" to="/app/onboarding/employee">
              Unirme con código
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const links = membership.isAdmin
    ? [
        {
          to: "/app/company/sites" as const,
          icon: <MapPin className="size-4" />,
          label: t("customer:companySites", { defaultValue: "Sedes" }),
        },
        {
          to: "/app/company/organization" as const,
          icon: <Network className="size-4" />,
          label: company.orgUnitLabel,
        },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        backTo="/app"
        title={company.name}
        subtitle={
          membership.isAdmin
            ? t("customer:companyAdmin", { defaultValue: "Administración" })
            : t("customer:companyMember", { defaultValue: "Empleado" })
        }
      />

      <div className="px-6 space-y-4">
        <div className="surface-raised border border-border/60 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="size-4" />
            <span className="meta-label">Company Code</span>
          </div>
          <p className="font-mono text-2xl font-extrabold tracking-widest">
            {company.companyCode}
          </p>
          {!membership.isAdmin ? (
            <p className="text-sm text-muted-foreground pt-2">
              {t("customer:employeeSees", {
                defaultValue: "Solo ves tu empresa, sede y unidad — sin administración.",
              })}
            </p>
          ) : null}
        </div>

        <div className="surface-raised border border-border/60 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-primary" />
            <span className="font-semibold text-sm">
              {t("customer:myAssignment", { defaultValue: "Mi asignación" })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Site: {membership.siteId ?? "—"}
            <br />
            {company.orgUnitLabel}: {membership.organizationalUnitId ?? "—"}
            {membership.internalLocation ? (
              <>
                <br />
                {company.internalLocationLabel}: {membership.internalLocation}
              </>
            ) : null}
          </p>
        </div>

        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 surface-raised border border-border/60 rounded-2xl px-4 py-4"
              >
                <span className="text-primary">{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
