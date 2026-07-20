import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useTranslation("admin");
  const cards = [
    ["tomorrowOrders", "0"],
    ["kitchenCapacity", "0%"],
    ["inventoryAlerts", "0"],
    ["purchasingPending", "0"],
  ] as const;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([k, v]) => (
          <div
            key={k}
            className="bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-5"
          >
            <p className="meta-label">{t(k)}</p>
            <p className="text-3xl font-extrabold tracking-tight mt-3">{v}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              awaiting data
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <div className="bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="meta-label">{t("liveProduction")}</p>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              live
            </span>
          </div>
          <div className="mt-6 h-40 rounded-xl bg-secondary/60 border border-dashed border-border grid place-items-center">
            <p className="text-xs text-muted-foreground">Awaiting production data</p>
          </div>
        </div>
        <div className="bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-5">
          <p className="meta-label">{t("inventoryAlerts")}</p>
          <div className="mt-6 h-40 rounded-xl bg-secondary/60 border border-dashed border-border grid place-items-center">
            <p className="text-xs text-muted-foreground">No alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
