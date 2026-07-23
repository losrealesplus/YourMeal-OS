/**
 * Employee join via Company Code — ADR 0015.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CompanyAccountService,
  type CompanyAccount,
  type OrganizationalUnit,
  type Site,
} from "@/modules/company-account";
import { PrimaryCTA, ScreenHeader } from "@/components/consumer";

export const Route = createFileRoute("/_authenticated/app/onboarding/employee")({
  component: EmployeeJoinPage,
});

function EmployeeJoinPage() {
  const { t } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const { user, tenantId, roles } = useAuth();
  const [code, setCode] = useState("");
  const [company, setCompany] = useState<CompanyAccount | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [siteId, setSiteId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [internalLocation, setInternalLocation] = useState("");
  const [busy, setBusy] = useState(false);

  async function ctx() {
    if (!user || !tenantId) throw new Error("Tenant required");
    return createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
  }

  async function validateCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      const found = await CompanyAccountService.lookupCompanyByCode(
        serviceCtx,
        code,
      );
      const siteList = await CompanyAccountService.listSites(
        serviceCtx,
        found.id,
      );
      setCompany(found);
      setSites(siteList);
      setSiteId(siteList[0]?.id ?? "");
      if (siteList[0]) {
        const unitList = await CompanyAccountService.listOrganizationalUnits(
          serviceCtx,
          siteList[0].id,
        );
        setUnits(unitList);
        setUnitId(unitList[0]?.id ?? "");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSiteChange(id: string) {
    setSiteId(id);
    setUnitId("");
    setUnits([]);
    if (!id || !user || !tenantId) return;
    try {
      const serviceCtx = await ctx();
      const unitList = await CompanyAccountService.listOrganizationalUnits(
        serviceCtx,
        id,
      );
      setUnits(unitList);
      setUnitId(unitList[0]?.id ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !siteId || !unitId) return;
    setBusy(true);
    try {
      const serviceCtx = await ctx();
      await CompanyAccountService.joinCompany(serviceCtx, {
        companyCode: company.companyCode,
        siteId,
        organizationalUnitId: unitId,
        internalLocation: internalLocation || null,
      });
      toast.success(
        t("customer:joinedCompany", { defaultValue: "Te has unido a la empresa" }),
      );
      navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        backTo="/app/onboarding"
        title={t("customer:joinCompany", { defaultValue: "Unirme a una empresa" })}
        subtitle={t("customer:joinCompanyHint", {
          defaultValue: "Introduce el Company Code que te ha facilitado tu empresa.",
        })}
      />

      {!company ? (
        <form onSubmit={validateCode} className="px-6 space-y-4">
          <label className="block space-y-1">
            <span className="meta-label">Company Code</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EC-4821"
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm font-mono font-bold tracking-wider"
            />
          </label>
          <PrimaryCTA disabled={busy}>
            {t("customer:validateCompany", { defaultValue: "Validar empresa" })}
          </PrimaryCTA>
        </form>
      ) : (
        <form onSubmit={join} className="px-6 space-y-4">
          <div className="surface-raised border border-border/60 rounded-3xl p-4">
            <p className="meta-label">Empresa</p>
            <p className="font-bold mt-1">{company.name}</p>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {company.companyCode}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="meta-label">Sede</span>
            <select
              required
              value={siteId}
              onChange={(e) => onSiteChange(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm font-medium"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="meta-label">{company.orgUnitLabel}</span>
            <select
              required
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm font-medium"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="meta-label">
              {company.internalLocationLabel} ({t("common:optional", { defaultValue: "opcional" })})
            </span>
            <input
              value={internalLocation}
              onChange={(e) => setInternalLocation(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm font-medium"
            />
          </label>

          <PrimaryCTA disabled={busy || !unitId}>
            {t("customer:confirmJoin", { defaultValue: "Confirmar y continuar" })}
          </PrimaryCTA>
        </form>
      )}
    </div>
  );
}
