import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  AdminHeader,
  DataTable,
  KpiCard,
  PanelCard,
  ProgressBar,
  SectionTitle,
  SectionTitle as _S,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { MOCK_PROMOTIONS, type MockPromotion } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

// avoid unused import
void _S;

/**
 * ADMIN · Promociones
 * Objetivo operacional: Impulsar la adquisición y retención con incentivos
 * Capability:            promotions.run
 * Core Object:           Promotion + Redemption
 */
export const Route = createFileRoute("/_authenticated/admin/promotions")({
  component: AdminPromotionsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Promociones" },
      { name: "description", content: "Configura, monitoriza y evalúa promociones y códigos de descuento." },
    ],
  }),
});

function AdminPromotionsPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const toneByStatus = {
    active:    "positive" as const,
    scheduled: "info"     as const,
    ended:     "neutral"  as const,
  };

  const columns: Column<MockPromotion>[] = [
    {
      key: "code",
      header: t("code", { defaultValue: "Code" }),
      render: (r) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold tracking-widest">{r.code}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.name}</p>
        </div>
      ),
    },
    {
      key: "discount",
      header: t("discount", { defaultValue: "Discount" }),
      render: (r) => <span className="font-mono tabular-nums font-bold">−{r.discountPct}%</span>,
    },
    {
      key: "usage",
      header: t("usage", { defaultValue: "Redemptions" }),
      render: (r) => (
        <div className="min-w-[140px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs tabular-nums">{r.redemptions}</span>
            <span className="font-mono text-[10px] text-muted-foreground">/ {r.cap}</span>
          </div>
          <ProgressBar value={(r.redemptions / r.cap) * 100} />
        </div>
      ),
    },
    {
      key: "ends",
      header: t("ends", { defaultValue: "Ends" }),
      render: (r) => <span className="text-xs text-muted-foreground">{fmt.date(r.endsIso, "medium")}</span>,
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      render: (r) => <StatusChip tone={toneByStatus[r.status]} label={t(`promoStatuses.${r.status}`, { defaultValue: r.status })} />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("promotions")}
        title={t("promotionsTitle", { defaultValue: "Promociones" })}
        subtitle={t("promotionsSubtitle", { defaultValue: "Diseña incentivos para activar clientes y aumentar el ticket." })}
        trailing={
          <button className="h-10 rounded-xl bg-foreground text-background px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90 transition">
            <Plus className="size-3.5" /> {t("newPromotion", { defaultValue: "New promotion" })}
          </button>
        }
      />
      <AdminHeader
        goal={t("promotionsGoal", { defaultValue: "Aumentar conversión y frecuencia con incentivos medibles" })}
        capability="promotions.run"
        object="Promotion · Redemption"
      />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("activePromos", { defaultValue: "Active promotions" })} value="2" trend="flat" />
        <KpiCard label={t("redemptions", { defaultValue: "Redemptions (MTD)" })} value="824" delta="+112" trend="up" />
        <KpiCard label={t("avgDiscount", { defaultValue: "Avg discount" })} value="17%" trend="flat" />
        <KpiCard label={t("attributedRevenue", { defaultValue: "Attributed revenue" })} value="€ 6.240" delta="+18%" trend="up" />
      </div>

      <PanelCard>
        <DataTable columns={columns} rows={MOCK_PROMOTIONS} />
      </PanelCard>
    </div>
  );
}
