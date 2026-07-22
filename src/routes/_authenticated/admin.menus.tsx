import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CalendarPlus } from "lucide-react";
import {
  AdminHeader,
  KpiCard,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import { MOCK_ADMIN_MENUS, MOCK_MENU_GRID } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Menús semanales
 * Objetivo operacional: Planificar la oferta gastronómica semana a semana
 * Capability:            menus.plan
 * Core Object:           WeeklyMenu + Dish
 */
export const Route = createFileRoute("/_authenticated/admin/menus")({
  component: AdminMenusPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Menús semanales" },
      { name: "description", content: "Planificación y publicación de los menús de cada semana." },
    ],
  }),
});

function AdminMenusPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const toneByStatus = {
    published: "positive" as const,
    draft:     "warning"  as const,
    archived:  "neutral"  as const,
  };

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("menus")}
        title={t("menusTitle", { defaultValue: "Menús semanales" })}
        subtitle={t("menusSubtitle", { defaultValue: "Prepara, revisa y publica la oferta semanal para tus clientes." })}
        trailing={
          <button className="h-10 rounded-xl bg-foreground text-background px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90 transition">
            <CalendarPlus className="size-3.5" /> {t("newMenu", { defaultValue: "New menu" })}
          </button>
        }
      />
      <AdminHeader
        goal={t("menusGoal", { defaultValue: "Publicar cada semana un menú equilibrado y a tiempo" })}
        capability="menus.plan"
        object="WeeklyMenu · Dish"
      />

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <KpiCard label={t("publishedThisWeek", { defaultValue: "Published (this week)" })} value="1" trend="flat" />
        <KpiCard label={t("draftMenus", { defaultValue: "Draft menus" })} value="1" trend="up" delta="+1" />
        <KpiCard label={t("dishesInCatalog", { defaultValue: "Dishes in catalog" })} value="42" trend="up" delta="+3" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <PanelCard title={t("upcomingWeeks", { defaultValue: "Upcoming weeks" })}>
          <ul className="divide-y divide-border/60">
            {MOCK_ADMIN_MENUS.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-semibold">{fmt.date(m.weekIsoStart, "medium")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.dishesCount} {t("dishes").toLowerCase()} · {m.ordersCount} {t("orders", { defaultValue: "orders" }).toLowerCase()}
                  </p>
                </div>
                <StatusChip tone={toneByStatus[m.status]} label={t(`menuStatuses.${m.status}`, { defaultValue: m.status })} />
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title={t("weekCoverage", { defaultValue: "Slot coverage" })}>
          <div className="grid grid-cols-7 gap-1.5">
            {MOCK_MENU_GRID.map((d) => {
              const pct = (d.filled / d.slots) * 100;
              const bg =
                pct === 100 ? "bg-primary" : pct >= 60 ? "bg-primary/60" : pct > 0 ? "bg-[oklch(0.68_0.16_75)]" : "bg-secondary";
              return (
                <div key={d.day} className="text-center">
                  <div className={`h-16 rounded-lg ${bg} grid place-items-end p-1.5`}>
                    <span className="text-[10px] font-mono font-bold text-background">
                      {d.filled}/{d.slots}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {d.day}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {t("weekCoverageHint", { defaultValue: "Cada casilla representa un slot del menú semanal." })}
          </p>
        </PanelCard>
      </div>
    </div>
  );
}
