/**
 * Onboarding — Individual (B2C) or Employee join (B2B).
 * Companies are NOT self-registered (EatClean provisions them — ADR 0015).
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserRound, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { CompanyAccountService } from "@/modules/company-account";
import { PrimaryCTA, ScreenHeader } from "@/components/consumer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  component: OnboardingTypePage,
});

function OnboardingTypePage() {
  const { t } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const { user, tenantId, roles } = useAuth();
  const [busy, setBusy] = useState(false);

  async function chooseIndividual() {
    if (!user || !tenantId) {
      toast.error("Tenant required");
      return;
    }
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await CompanyAccountService.ensureIndividualCustomer(ctx);
      navigate({ to: "/app", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        title={t("customer:onboardingTitle", {
          defaultValue: "¿Cómo vas a pedir?",
        })}
        subtitle={t("customer:onboardingHint", {
          defaultValue:
            "Particular o empleado de una empresa ya dada de alta por EatClean.",
        })}
      />

      <div className="px-6 space-y-3">
        <ChoiceCard
          icon={<UserRound className="size-5" />}
          title={t("customer:onboardingIndividual", { defaultValue: "Particular" })}
          hint={t("customer:onboardingIndividualHint", {
            defaultValue: "Pido para mí. Misma experiencia de siempre.",
          })}
          onClick={chooseIndividual}
          disabled={busy}
        />
        <Link to="/app/onboarding/employee" className="block">
          <ChoiceCard
            icon={<Users className="size-5" />}
            title={t("customer:onboardingEmployee", {
              defaultValue: "Empleado de una empresa",
            })}
            hint={t("customer:onboardingEmployeeHint", {
              defaultValue:
                "Me uno con el Company Code que me ha facilitado mi empresa.",
            })}
            asDiv
          />
        </Link>
      </div>

      <p className="px-6 mt-8 text-xs text-muted-foreground text-pretty">
        ¿Representas a una empresa interesada? El alta la realiza EatClean tras el
        proceso comercial — no hay registro público de empresas.
      </p>

      <div className="px-6 mt-4">
        <PrimaryCTA variant="outline" onClick={() => navigate({ to: "/app" })}>
          {t("common:back", { defaultValue: "Volver" })}
        </PrimaryCTA>
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  hint,
  onClick,
  disabled,
  asDiv,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick?: () => void;
  disabled?: boolean;
  asDiv?: boolean;
}) {
  const className = cn(
    "w-full text-left surface-raised border border-border/60 rounded-3xl p-5 flex gap-4 transition-colors",
    "hover:bg-secondary/40 active:bg-secondary",
    disabled && "opacity-60 pointer-events-none",
  );
  const body = (
    <>
      <span className="grid place-items-center size-11 rounded-2xl bg-primary/10 text-primary shrink-0">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-[15px]">{title}</span>
        <span className="block text-sm text-muted-foreground mt-1">{hint}</span>
      </span>
    </>
  );
  if (asDiv) return <div className={className}>{body}</div>;
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {body}
    </button>
  );
}
