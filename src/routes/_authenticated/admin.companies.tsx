/**
 * Admin · Clientes Empresa — commercial provisioning of Company Accounts (ADR 0015).
 * Companies are NOT self-registered; EatClean staff creates them here.
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CompanyAccountService,
  type CompanyAccount,
  type ProvisionCompanyInput,
} from "@/modules/company-account";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/companies")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") || roles.includes("company_admin");
    if (!allowed) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminCompaniesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Clientes Empresa" },
      {
        name: "description",
        content: "Alta comercial de Company Accounts (B2B).",
      },
    ],
  }),
});

const emptyForm: ProvisionCompanyInput = {
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
};

function AdminCompaniesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { user, tenantId, roles } = useAuth();
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProvisionCompanyInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  async function reload() {
    if (!user || !tenantId) return;
    const ctx = await createServiceContext({
      supabase,
      userId: user.id,
      tenantId,
      roles,
    });
    setCompanies(await CompanyAccountService.listCompanies(ctx));
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

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
      const result = await CompanyAccountService.provisionCompany(ctx, form);
      setLastCode(result.company.companyCode);
      setForm(emptyForm);
      setShowForm(false);
      await reload();
      toast.success(
        t("admin:companyProvisioned", {
          defaultValue: "Empresa dada de alta",
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administración
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Clientes Empresa
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Las empresas no se registran solas. EatClean las da de alta tras el
            proceso comercial. Los empleados se vinculan después con el Company
            Code.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4 mr-1" />
          Nueva Empresa
        </Button>
      </header>

      {lastCode ? (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Company Code generado
          </p>
          <p className="font-mono text-2xl font-extrabold tracking-widest mt-1">
            {lastCode}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            No editable. Compártelo con la empresa / empleados (o usa invitaciones
            cuando estén disponibles).
          </p>
        </Card>
      ) : null}

      {showForm ? (
        <Card className="p-5">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Nombre comercial", true],
                ["vatId", "CIF / NIF", false],
                ["contactName", "Persona de contacto", true],
                ["contactEmail", "Email contacto", true],
                ["contactPhone", "Teléfono", false],
                ["fiscalAddress", "Dirección fiscal", true],
                ["deliveryAddress", "Dirección entrega (sede)", false],
                ["commercialTerms", "Condiciones comerciales", false],
                ["orgUnitLabel", "Etiqueta unidades (Departamento…)", false],
                ["siteName", "Primera sede", false],
                ["unitName", "Primera unidad organizativa", false],
              ] as const
            ).map(([key, label, required]) => (
              <div key={key} className="space-y-1.5 sm:col-span-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  required={required}
                  value={String(form[key] ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <Button type="submit" disabled={busy}>
                Guardar y generar Company Code
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {companies.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Aún no hay Company Accounts. Crea la primera tras aceptar un cliente
            comercial.
          </Card>
        ) : (
          companies.map((c) => (
            <Card key={c.id} className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="font-mono text-sm tracking-wider mt-0.5">
                  {c.companyCode}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {c.contactName} · {c.contactEmail}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/admin/customers">Ver clientes</Link>
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
