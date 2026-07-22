import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@/components/admin";

/**
 * ADMIN · Design System · Typography
 * Objetivo operacional: Documentar familias tipográficas y escala
 * Capability:            platform.designSystem.typography
 * Core Object:           Typography
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/typography")({
  component: TypographyPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Tipografía" },
      { name: "description", content: "Familias, jerarquías y utilidades tipográficas." },
    ],
  }),
});

const SCALE = [
  { name: "display",  cls: "text-5xl font-extrabold tracking-tighter", sample: "Stainless" },
  { name: "h1",       cls: "text-4xl font-bold tracking-tight",         sample: "Cocina en control" },
  { name: "h2",       cls: "text-3xl font-bold tracking-tight",         sample: "Sección" },
  { name: "h3",       cls: "text-2xl font-semibold",                    sample: "Subsección" },
  { name: "h4",       cls: "text-xl font-semibold",                     sample: "Panel" },
  { name: "body-lg",  cls: "text-base",                                  sample: "Texto principal para bloques largos." },
  { name: "body",     cls: "text-sm",                                    sample: "Texto de interfaz por defecto." },
  { name: "caption",  cls: "text-xs text-muted-foreground",              sample: "Descripción o pista contextual" },
  { name: "meta",     cls: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", sample: "META · LABEL" },
  { name: "mono",     cls: "font-mono text-sm tabular-nums",              sample: "1 250,00 g · UTC 12:30" },
];

function TypographyPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <PanelCard title={t("dsFontSans", { defaultValue: "Sans — Inter" })}>
          <p className="font-sans text-5xl font-extrabold tracking-tighter">Aa</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-3">--font-sans · --font-display</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dsFontSansDesc", { defaultValue: "Interfaz, jerarquías, titulares y cuerpo de texto." })}
          </p>
        </PanelCard>
        <PanelCard title={t("dsFontMono", { defaultValue: "Mono — JetBrains Mono" })}>
          <p className="font-mono text-5xl font-bold tabular-nums">01·23</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-3">--font-mono</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dsFontMonoDesc", { defaultValue: "Cifras, códigos, timestamps y datos operativos." })}
          </p>
        </PanelCard>
      </div>

      <PanelCard title={t("dsScale", { defaultValue: "Type scale" })}>
        <div className="divide-y divide-border">
          {SCALE.map((row) => (
            <div key={row.name} className="grid grid-cols-[80px_1fr] items-baseline gap-6 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{row.name}</p>
              <p className={row.cls}>{row.sample}</p>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
