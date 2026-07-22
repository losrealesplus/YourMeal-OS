import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@/components/admin";
import { Button } from "@/components/ui/button";

/**
 * ADMIN · Design System · Motion
 * Objetivo operacional: Definir principios y utilidades de animación
 * Capability:            platform.designSystem.motion
 * Core Object:           Motion
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/motion")({
  component: MotionPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Animaciones" },
      { name: "description", content: "Principios y utilidades de animación." },
    ],
  }),
});

const EASINGS = [
  { name: "ease-out",         desc: "UI reveal & state changes" },
  { name: "ease-in-out",      desc: "Transiciones bidireccionales" },
  { name: "--ease-out-expo",  desc: "Overshoot expresivo (motion hero)" },
];

const DURATIONS = [
  { name: "150ms", desc: "Micro-interacciones (hover, chip)" },
  { name: "200ms", desc: "Scale / accordions" },
  { name: "300ms", desc: "Fade & slide de vistas" },
  { name: "600ms", desc: "Entradas heroicas y sync compensado" },
];

function MotionPage() {
  const { t } = useTranslation("admin");
  const [tick, setTick] = useState(0);

  return (
    <div className="space-y-6">
      <PanelCard title={t("dsMotionPrinciples", { defaultValue: "Principles" })}>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• {t("dsMotionP1", { defaultValue: "Físico y preciso: el movimiento comunica causa, no decora." })}</li>
          <li>• {t("dsMotionP2", { defaultValue: "Nunca bloquea la lectura de datos operativos." })}</li>
          <li>• {t("dsMotionP3", { defaultValue: "Respeta prefers-reduced-motion en todo animación no-esencial." })}</li>
          <li>• {t("dsMotionP4", { defaultValue: "Duraciones cortas por defecto; usar 600ms sólo para transiciones significativas." })}</li>
        </ul>
      </PanelCard>

      <div className="grid gap-6 md:grid-cols-2">
        <PanelCard title={t("dsMotionEasings", { defaultValue: "Easings" })}>
          <div className="divide-y divide-border">
            {EASINGS.map((e) => (
              <div key={e.name} className="py-3 flex items-baseline justify-between gap-4">
                <p className="font-mono text-xs">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title={t("dsMotionDurations", { defaultValue: "Durations" })}>
          <div className="divide-y divide-border">
            {DURATIONS.map((d) => (
              <div key={d.name} className="py-3 flex items-baseline justify-between gap-4">
                <p className="font-mono text-xs tabular-nums">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title={t("dsMotionPlayground", { defaultValue: "Playground" })}
        action={<Button size="sm" variant="outline" onClick={() => setTick((n) => n + 1)}>{t("dsMotionReplay", { defaultValue: "Replay" })}</Button>}
      >
        <div key={tick} className="grid gap-4 md:grid-cols-4">
          <div className="p-5 rounded-xl bg-card border border-border animate-fade-in">
            <p className="meta-label mb-2">fade-in</p>
            <div className="h-10 rounded bg-primary/20" />
          </div>
          <div className="p-5 rounded-xl bg-card border border-border animate-scale-in">
            <p className="meta-label mb-2">scale-in</p>
            <div className="h-10 rounded bg-primary/20" />
          </div>
          <div className="p-5 rounded-xl bg-card border border-border overflow-hidden">
            <p className="meta-label mb-2">slide-in-right</p>
            <div className="h-10 rounded bg-primary/20 animate-slide-in-right" />
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <p className="meta-label mb-2">hover-scale</p>
            <div className="h-10 rounded bg-primary/20 hover-scale" />
          </div>
        </div>
      </PanelCard>

      <PanelCard title={t("dsMotionUtilities", { defaultValue: "Utilities" })}>
        <div className="grid gap-2 font-mono text-xs">
          <code className="text-muted-foreground">className="animate-fade-in"</code>
          <code className="text-muted-foreground">className="animate-scale-in"</code>
          <code className="text-muted-foreground">className="animate-slide-in-right"</code>
          <code className="text-muted-foreground">className="hover-scale"</code>
          <code className="text-muted-foreground">className="story-link"</code>
        </div>
      </PanelCard>
    </div>
  );
}
