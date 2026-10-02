import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "@/components/consumer";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import { CustomerDietaryEditor } from "@/components/admin/customer-dietary-editor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Screen: Customer · Dietary Preferences & Allergens Self-Service
 * CR-OPS-DIET-01 (P1)
 * Constitutional disclaimer, EU-14 allergens, custom tags, restrictions, preferences, kitchen notes.
 */
export const Route = createFileRoute("/_authenticated/app/settings/dietary")({
  component: DietarySettingsPage,
});

function DietarySettingsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const customerQuery = useCurrentCustomerId();
  const customerId = customerQuery.data ?? null;

  return (
    <div className="flex-1 flex flex-col pb-8">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings")}
        title={t("customer:dietaryTitle", "Alergias y Preferencias")}
      />

      <div className="px-6 space-y-4">
        {customerQuery.isLoading ? (
          <div className="flex items-center justify-center p-12 border border-border/60 rounded-2xl bg-card">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {t("common:loading", "Cargando...")}
            </span>
          </div>
        ) : !customerId ? (
          <div className="p-6 border border-border/60 rounded-2xl bg-card text-center space-y-2">
            <p className="text-sm font-semibold">
              {t("customer:noCustomerProfile", "No se encontró el perfil de cliente asociado.")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "customer:completeOnboarding",
                "Por favor completa el onboarding antes de configurar tus preferencias dietéticas.",
              )}
            </p>
          </div>
        ) : (
          <CustomerDietaryEditor
            customerId={customerId}
            canWrite={true}
            onSaved={() => {
              toast.success("Perfil dietético actualizado correctamente");
            }}
          />
        )}
      </div>
    </div>
  );
}
