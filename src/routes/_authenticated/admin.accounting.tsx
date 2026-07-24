import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/accounting")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "accounting.operate");
  },
  component: AdminAccountingPage,
  head: () => ({
    meta: [{ title: "YourMeal OS — Contabilidad" }],
  }),
});

function AdminAccountingPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("accounting", { defaultValue: "Contabilidad" })}
      description="Módulo no activado en RI-001 (flag admin_module_accounting). Sin datos simulados."
    />
  );
}
