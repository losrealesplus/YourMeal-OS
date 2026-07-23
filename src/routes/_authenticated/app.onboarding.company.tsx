/**
 * Company Account registration (B2B) — ADR 0015.
 * Generates Company Code; creates first Site + Organizational Unit; admin membership.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { CompanyAccountService } from "@/modules/company-account";
import { PrimaryCTA, ScreenHeader } from "@/components/consumer";

export const Route = createFileRoute("/_authenticated/app/onboarding/company")({
  component: CompanyRegisterPage,
});

function CompanyRegisterPage() {
  const { t } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const { user, tenantId, roles } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    vatId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    commercialTerms: "",
    fiscalAddress: "",
    deliveryAddress: "",
    orgUnitLabel: "Departamento",
    siteName: "Sede principal",
    unitName: "General",
  });
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const result = await CompanyAccountService.registerCompany(ctx, {
        name: form.name,
        vatId: form.vatId || null,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || null,
        commercialTerms: form.commercialTerms || null,
        fiscalAddress: form.fiscalAddress,
        deliveryAddress: form.deliveryAddress || null,
        orgUnitLabel: form.orgUnitLabel,
        siteName: form.siteName,
        unitName: form.unitName,
      });
      setCreatedCode(result.company.companyCode);
      toast.success(
        t("customer:companyCreated", {
          defaultValue: "Empresa creada",
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (createdCode) {
    return (
      <div className="flex-1 flex flex-col px-6 pb-10">
        <ScreenHeader
          backTo="/app/onboarding"
          title={t("customer:companyCodeTitle", { defaultValue: "Company Code" })}
        />
        <div className="surface-raised border border-border/60 rounded-3xl p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("customer:companyCodeHint", {
              defaultValue:
                "Comparte este código con tus empleados. No es editable.",
            })}
          </p>
          <p className="text-3xl font-extrabold tracking-widest font-mono">
            {createdCode}
          </p>
        </div>
        <div className="mt-8 space-y-3">
          <PrimaryCTA onClick={() => navigate({ to: "/app/company" })}>
            {t("customer:openCompanyPortal", {
              defaultValue: "Abrir portal empresa",
            })}
          </PrimaryCTA>
          <PrimaryCTA variant="outline" onClick={() => navigate({ to: "/app" })}>
            {t("customer:goToMenu", { defaultValue: "Ir al menú" })}
          </PrimaryCTA>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        backTo="/app/onboarding"
        title={t("customer:registerCompany", { defaultValue: "Registrar empresa" })}
        subtitle={t("customer:registerCompanyHint", {
          defaultValue: "Datos fiscales, contacto y primera sede.",
        })}
      />
      <form onSubmit={submit} className="px-6 space-y-3">
        {(
          [
            ["name", "Nombre empresa", true],
            ["vatId", "CIF / VAT", false],
            ["contactName", "Persona de contacto", true],
            ["contactEmail", "Email de contacto", true],
            ["contactPhone", "Teléfono", false],
            ["fiscalAddress", "Dirección fiscal", true],
            ["deliveryAddress", "Dirección de entrega", false],
            ["commercialTerms", "Condiciones comerciales", false],
            ["orgUnitLabel", "Cómo llamáis a las unidades", false],
            ["siteName", "Primera sede", false],
            ["unitName", "Primera unidad organizativa", false],
          ] as const
        ).map(([key, label, required]) => (
          <label key={key} className="block space-y-1">
            <span className="meta-label">{label}</span>
            <input
              required={required}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm font-medium"
            />
          </label>
        ))}
        <div className="pt-4">
          <PrimaryCTA disabled={busy}>
            {busy
              ? t("common:loading", { defaultValue: "…" })
              : t("customer:createCompany", { defaultValue: "Crear empresa" })}
          </PrimaryCTA>
        </div>
      </form>
    </div>
  );
}
