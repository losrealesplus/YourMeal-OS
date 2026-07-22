import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@/components/admin";

/**
 * ADMIN · Design System · Tokens
 * Objetivo operacional: Exponer los tokens fundacionales del sistema
 * Capability:            platform.designSystem.tokens
 * Core Object:           Token
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/")({
  component: TokensPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Tokens" },
      { name: "description", content: "Tokens de color, radios y elevación." },
    ],
  }),
});

const COLOR_TOKENS: { name: string; varName: string; className: string }[] = [
  { name: "background",   varName: "--background",   className: "bg-background border border-border" },
  { name: "foreground",   varName: "--foreground",   className: "bg-foreground" },
  { name: "card",         varName: "--card",         className: "bg-card border border-border" },
  { name: "primary",      varName: "--primary",      className: "bg-primary" },
  { name: "secondary",    varName: "--secondary",    className: "bg-secondary" },
  { name: "muted",        varName: "--muted",        className: "bg-muted" },
  { name: "accent",       varName: "--accent",       className: "bg-accent" },
  { name: "destructive",  varName: "--destructive",  className: "bg-destructive" },
  { name: "warn",         varName: "--warn",         className: "bg-warn" },
  { name: "critical",     varName: "--critical",     className: "bg-critical" },
  { name: "border",       varName: "--border",       className: "bg-border" },
  { name: "ring",         varName: "--ring",         className: "bg-ring" },
];

const BRAND_TOKENS = [
  { name: "brand-cream", varName: "--brand-cream", className: "bg-brand-cream" },
  { name: "brand-clay",  varName: "--brand-clay",  className: "bg-brand-clay" },
  { name: "brand-leaf",  varName: "--brand-leaf",  className: "bg-brand-leaf" },
  { name: "brand-sand",  varName: "--brand-sand",  className: "bg-brand-sand" },
];

const CHART_TOKENS = [1, 2, 3, 4, 5].map((n) => ({
  name: `chart-${n}`,
  varName: `--chart-${n}`,
  className: `bg-chart-${n}`,
}));

const RADII = [
  { name: "sm", cls: "rounded-sm" },
  { name: "md", cls: "rounded-md" },
  { name: "lg", cls: "rounded-lg" },
  { name: "xl", cls: "rounded-xl" },
  { name: "2xl", cls: "rounded-2xl" },
  { name: "3xl", cls: "rounded-3xl" },
  { name: "full", cls: "rounded-full" },
];

const SHADOWS = [
  { name: "shadow-xs", cls: "shadow-xs" },
  { name: "shadow-sm", cls: "shadow-sm" },
  { name: "shadow-md", cls: "shadow-md" },
  { name: "shadow-lg", cls: "shadow-lg" },
  { name: "shadow-xl", cls: "shadow-xl" },
];

function Swatch({ name, varName, className }: { name: string; varName: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-xl ring-1 ring-black/[0.04] ${className}`} />
      <div>
        <p className="text-xs font-semibold">{name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{varName}</p>
      </div>
    </div>
  );
}

function TokensPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <PanelCard title={t("dsColorsCore", { defaultValue: "Core palette" })}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {COLOR_TOKENS.map((tk) => <Swatch key={tk.name} {...tk} />)}
        </div>
      </PanelCard>

      <PanelCard title={t("dsColorsBrand", { defaultValue: "EatClean brand accents" })}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BRAND_TOKENS.map((tk) => <Swatch key={tk.name} {...tk} />)}
        </div>
      </PanelCard>

      <PanelCard title={t("dsColorsChart", { defaultValue: "Chart palette" })}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CHART_TOKENS.map((tk) => <Swatch key={tk.name} {...tk} />)}
        </div>
      </PanelCard>

      <div className="grid gap-6 md:grid-cols-2">
        <PanelCard title={t("dsRadii", { defaultValue: "Radii" })}>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            {RADII.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`size-14 bg-secondary border border-border ${r.cls}`} />
                <p className="font-mono text-[10px] text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title={t("dsElevation", { defaultValue: "Elevation" })}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SHADOWS.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                <div className={`size-14 rounded-xl bg-card ${s.cls}`} />
                <p className="font-mono text-[10px] text-muted-foreground">{s.name}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
