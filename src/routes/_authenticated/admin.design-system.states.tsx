import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelCard, StatusChip, ProgressBar } from "@/components/admin";
import { Button } from "@/components/ui/button";

/**
 * ADMIN · Design System · States
 * Objetivo operacional: Documentar estados semánticos y feedback
 * Capability:            platform.designSystem.states
 * Core Object:           State
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/states")({
  component: StatesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Estados" },
      { name: "description", content: "Estados semánticos: éxito, alerta, error, información y neutro." },
    ],
  }),
});

function StatesPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <PanelCard title={t("dsStatusChips", { defaultValue: "Status chips" })}>
        <div className="flex flex-wrap gap-3">
          <StatusChip tone="neutral"  label={t("dsToneNeutral",  { defaultValue: "Neutral" })} />
          <StatusChip tone="info"     label={t("dsToneInfo",     { defaultValue: "Info" })} />
          <StatusChip tone="positive" label={t("dsTonePositive", { defaultValue: "Positive" })} />
          <StatusChip tone="warning"  label={t("dsToneWarning",  { defaultValue: "Warning" })} />
          <StatusChip tone="danger"   label={t("dsToneDanger",   { defaultValue: "Danger" })} />
        </div>
      </PanelCard>

      <PanelCard title={t("dsFeedbackBlocks", { defaultValue: "Feedback blocks" })}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("dsToneSuccess", { defaultValue: "Success" })}</p>
            <p className="text-sm mt-1">{t("dsSuccessMsg", { defaultValue: "El pedido se ha programado correctamente para el jueves." })}</p>
          </div>
          <div className="p-4 rounded-xl bg-warn/12 border border-warn/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.5_0.12_75)]">{t("dsToneWarning", { defaultValue: "Warning" })}</p>
            <p className="text-sm mt-1">{t("dsWarnMsg", { defaultValue: "Stock por debajo del umbral para 3 ingredientes." })}</p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/8 border border-destructive/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">{t("dsToneError", { defaultValue: "Error" })}</p>
            <p className="text-sm mt-1">{t("dsErrorMsg", { defaultValue: "No hemos podido confirmar la entrega. Reintenta." })}</p>
          </div>
          <div className="p-4 rounded-xl bg-chart-2/10 border border-chart-2/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-chart-2">{t("dsToneInfo", { defaultValue: "Info" })}</p>
            <p className="text-sm mt-1">{t("dsInfoMsg", { defaultValue: "La programación semanal se cierra los viernes a las 20:00." })}</p>
          </div>
        </div>
      </PanelCard>

      <PanelCard title={t("dsProgress", { defaultValue: "Progress" })}>
        <div className="space-y-4 max-w-md">
          {[15, 42, 68, 92, 100].map((v) => (
            <div key={v}>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                <span>value</span><span className="tabular-nums">{v}%</span>
              </div>
              <ProgressBar value={v} />
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title={t("dsInteractive", { defaultValue: "Interactive states" })}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <p className="meta-label">{t("dsStateDefault", { defaultValue: "Default" })}</p>
            <Button className="w-full">Action</Button>
          </div>
          <div className="space-y-2">
            <p className="meta-label">{t("dsStateHover", { defaultValue: "Hover" })}</p>
            <Button className="w-full bg-primary/90">Action</Button>
          </div>
          <div className="space-y-2">
            <p className="meta-label">{t("dsStateFocus", { defaultValue: "Focus" })}</p>
            <Button className="w-full ring-3 ring-ring/40">Action</Button>
          </div>
          <div className="space-y-2">
            <p className="meta-label">{t("dsStateDisabled", { defaultValue: "Disabled" })}</p>
            <Button disabled className="w-full">Action</Button>
          </div>
        </div>
      </PanelCard>

      <PanelCard title={t("dsEmpty", { defaultValue: "Empty & loading" })}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-8 rounded-xl border border-dashed border-border text-center">
            <p className="meta-label mb-1">{t("dsEmptyLabel", { defaultValue: "Empty state" })}</p>
            <p className="text-sm text-muted-foreground">{t("dsEmptyMsg", { defaultValue: "Aún no hay pedidos para esta ventana." })}</p>
          </div>
          <div className="p-8 rounded-xl border border-border bg-card space-y-3">
            <div className="h-3 rounded bg-secondary animate-pulse" />
            <div className="h-3 rounded bg-secondary animate-pulse w-4/5" />
            <div className="h-3 rounded bg-secondary animate-pulse w-3/5" />
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
