import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { ScreenHeader, PrimaryCTA } from "@/components/consumer";

/**
 * Screen: Customer · Personal Info
 * - Objetivo operacional: mantener datos personales al día.
 * - Capability: profile.manage
 * - Core Object(s): CustomerProfile
 */
export const Route = createFileRoute("/_authenticated/app/settings/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const fields: Array<[string, string]> = [
    [t("customer:fullName"), (user?.user_metadata?.full_name as string) ?? "—"],
    [t("common:email"), user?.email ?? "—"],
    [t("common:phone"), (user?.user_metadata?.phone as string) ?? "—"],
  ];

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings")}
        title={t("customer:personalInfo")}
      />
      <div className="px-6">
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {fields.map(([label, value]) => (
            <div key={label} className="px-4 py-4">
              <p className="meta-label">{label}</p>
              <p className="mt-1 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <PrimaryCTA disabled>{t("customer:editProfile")}</PrimaryCTA>
          <p className="text-xs text-muted-foreground text-center mt-3">
            {t("common:comingSoon")}
          </p>
        </div>
      </div>
    </div>
  );
}
