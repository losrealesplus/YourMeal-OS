import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/app/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useTranslation(["customer", "common"]);
  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 pt-10 pb-6">
        <p className="meta-label">{t("common:tenant")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {t("customer:orders")}
        </h1>
      </header>
      <div className="px-6">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="font-bold">{t("customer:noOrdersTitle")}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("customer:noOrdersHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
