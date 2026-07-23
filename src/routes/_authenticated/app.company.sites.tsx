/**
 * Company Portal · Sites management
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
  type Site,
} from "@/modules/company-account";
import { PrimaryCTA, ScreenHeader } from "@/components/consumer";

export const Route = createFileRoute("/_authenticated/app/company/sites")({
  component: CompanySitesPage,
});

function CompanySitesPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user, tenantId, roles } = useAuth();
  const [company, setCompany] = useState<CompanyAccount | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!user || !tenantId) return;
    const ctx = await createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
    const bound = await CompanyAccountService.getMembershipForUser(ctx);
    if (!bound || !bound.membership.isAdmin) {
      setCompany(null);
      setSites([]);
      return;
    }
    setCompany(bound.company);
    setSites(await CompanyAccountService.listSites(ctx, bound.company.id));
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  async function createSite(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !user || !tenantId) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CompanyAccountService.createSite(ctx, {
        companyId: company.id,
        name,
        address: address || null,
      });
      setName("");
      setAddress("");
      await reload();
      toast.success(t("customer:siteCreated", { defaultValue: "Sede creada" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        backTo="/app/company"
        title={t("customer:companySites", { defaultValue: "Sedes" })}
      />
      <div className="px-6 space-y-4">
        <ul className="space-y-2">
          {sites.map((s) => (
            <li
              key={s.id}
              className="surface-raised border border-border/60 rounded-2xl px-4 py-3"
            >
              <p className="font-semibold text-sm">{s.name}</p>
              {s.address ? (
                <p className="text-xs text-muted-foreground mt-1">{s.address}</p>
              ) : null}
            </li>
          ))}
        </ul>

        {company ? (
          <form onSubmit={createSite} className="space-y-3 pt-4">
            <p className="meta-label">
              {t("customer:addSite", { defaultValue: "Nueva sede" })}
            </p>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección"
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm"
            />
            <PrimaryCTA disabled={busy}>
              {t("customer:saveSite", { defaultValue: "Guardar sede" })}
            </PrimaryCTA>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("customer:adminOnly", {
              defaultValue: "Solo el administrador de la empresa puede gestionar sedes.",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
