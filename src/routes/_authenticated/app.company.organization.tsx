/**
 * Company Portal · Organizational Units (tenant-labeled)
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/_authenticated/app/company/organization")({
  component: CompanyOrganizationPage,
});

function CompanyOrganizationPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user, tenantId, roles } = useAuth();
  const [company, setCompany] = useState<CompanyAccount | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUnits(ctxSiteId: string) {
    if (!user || !tenantId || !ctxSiteId) {
      setUnits([]);
      return;
    }
    const ctx = await createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
    setUnits(await CompanyAccountService.listOrganizationalUnits(ctx, ctxSiteId));
  }

  useEffect(() => {
    (async () => {
      if (!user || !tenantId) return;
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const bound = await CompanyAccountService.getMembershipForUser(ctx);
        if (!bound || !bound.membership.isAdmin) {
          setCompany(null);
          return;
        }
        setCompany(bound.company);
        const siteList = await CompanyAccountService.listSites(ctx, bound.company.id);
        setSites(siteList);
        const first = siteList[0]?.id ?? "";
        setSiteId(first);
        if (first) await loadUnits(first);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  async function createUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !siteId || !user || !tenantId) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CompanyAccountService.createOrganizationalUnit(ctx, {
        companyId: company.id,
        siteId,
        name,
      });
      setName("");
      await loadUnits(siteId);
      toast.success(
        t("customer:unitCreated", { defaultValue: "Unidad creada" }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const label = company?.orgUnitLabel ?? "Unidad";

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader backTo="/app/company" title={label} />
      <div className="px-6 space-y-4">
        {company ? (
          <>
            <label className="block space-y-1">
              <span className="meta-label">Sede</span>
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  loadUnits(e.target.value).catch(() => undefined);
                }}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <ul className="space-y-2">
              {units.map((u) => (
                <li
                  key={u.id}
                  className="surface-raised border border-border/60 rounded-2xl px-4 py-3 font-semibold text-sm"
                >
                  {u.name}
                </li>
              ))}
            </ul>

            <form onSubmit={createUnit} className="space-y-3 pt-2">
              <p className="meta-label">
                {t("customer:addUnit", { defaultValue: "Nueva unidad" })}
              </p>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={label}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm"
              />
              <PrimaryCTA disabled={busy || !siteId}>
                {t("customer:saveUnit", { defaultValue: "Guardar unidad" })}
              </PrimaryCTA>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("customer:adminOnly", {
              defaultValue: "Solo el administrador de la empresa puede gestionar la organización.",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
