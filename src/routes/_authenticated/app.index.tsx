import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/")({
  component: CustomerHome,
});

function CustomerHome() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 pt-10 pb-6">
        <p className="meta-label">{t("common:tenant")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {t("customer:greeting")}, {name}
        </h1>
      </header>

      <section className="px-6 space-y-4">
        <div className="bg-secondary/60 border border-border rounded-2xl p-5">
          <p className="meta-label">{t("customer:nextDelivery")}</p>
          <p className="text-lg font-bold mt-2">— · —</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("common:comingSoon")}
          </p>
        </div>

        <div className="bg-primary text-primary-foreground rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">
            {t("customer:scheduleTitle")}
          </p>
          <button className="mt-4 bg-primary-foreground text-primary text-sm font-bold py-3 px-5 rounded-lg">
            {t("customer:scheduleCta")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("customer:mealsOrdered")} value="0" />
          <Stat label={t("customer:daysCovered")} value="0" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="meta-label">{t("customer:promotions")}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("common:comingSoon")}
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="meta-label">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight mt-2">{value}</p>
    </div>
  );
}
