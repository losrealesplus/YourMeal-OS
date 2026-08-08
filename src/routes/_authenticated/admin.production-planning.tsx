/**
 * PRODUCTION EXPERIENCE 001 · 002 · 003 · 004 · 005 · 006
 * Planning · Search · Adaptation · Preps · Alerts · Kitchen Handoff
 *
 * Grammar: Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
 * Source: published operational week (Menu Experience).
 * Experience only — no Production / Kitchen Capability · Facade · Engine changes.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { ProductionAdaptationPanel } from "@/production-experience/ProductionAdaptationPanel";
import { ProductionAlertsPanel } from "@/production-experience/ProductionAlertsPanel";
import { ProductionHandoffPanel } from "@/production-experience/ProductionHandoffPanel";
import { ProductionPlanningPanel } from "@/production-experience/ProductionPlanningPanel";
import { ProductionPrepsPanel } from "@/production-experience/ProductionPrepsPanel";
import { ProductionSearchPanel } from "@/production-experience/ProductionSearchPanel";
import type { RiskNextAction } from "@/production-experience/alerts-view";
import type { HandoffNavAction } from "@/production-experience/handoff-view";

type ExperienceMode =
  | "search"
  | "planning"
  | "adapt"
  | "preps"
  | "alerts"
  | "handoff";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return (
    value === "planning" ||
    value === "search" ||
    value === "adapt" ||
    value === "preps" ||
    value === "alerts" ||
    value === "handoff"
  );
}

export const Route = createFileRoute(
  "/_authenticated/admin/production-planning",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: isExperienceMode(search.mode)
      ? search.mode
      : ("search" as const),
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title:
          "YourMeal OS — Production Experience · Kitchen Handoff · Alerts",
      },
      {
        name: "description",
        content:
          "PRODUCTION EXPERIENCE 006 Kitchen Handoff · 005 Alerts · 004 Preps · TPKH <5 min",
      },
    ],
  }),
});

function ProductionPlanningExperiencePage() {
  const { can } = useCan();
  const canWrite = can("production.operate");
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const [mode, setMode] = useState<ExperienceMode>(() =>
    isExperienceMode(searchParams.mode) ? searchParams.mode : "search",
  );
  const [focusWeekStart, setFocusWeekStart] = useState<string | null>(
    searchParams.weekStart ?? null,
  );

  function goMode(next: ExperienceMode, weekStart?: string) {
    setMode(next);
    if (weekStart) setFocusWeekStart(weekStart);
    void navigate({
      to: "/admin/production-planning",
      search: {
        mode: next,
        weekStart: weekStart || focusWeekStart || undefined,
      },
    });
  }

  function onAlertNavigate(action: RiskNextAction, weekStart: string) {
    if (action === "adapt") goMode("adapt", weekStart || undefined);
    else if (action === "preps") goMode("preps", weekStart || undefined);
    else if (action === "handoff") goMode("handoff", weekStart || undefined);
    else goMode("planning", weekStart || undefined);
  }

  function onHandoffNavigate(action: HandoffNavAction, weekStart: string) {
    if (action === "alerts") goMode("alerts", weekStart || undefined);
    else if (action === "preps") goMode("preps", weekStart || undefined);
    else if (action === "adapt") goMode("adapt", weekStart || undefined);
    else goMode("planning", weekStart || undefined);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "handoff"
            ? "PRODUCTION EXPERIENCE 006 · Kitchen Handoff"
            : mode === "alerts"
              ? "PRODUCTION EXPERIENCE 005 · Alerts & Deadlines"
              : mode === "preps"
                ? "PRODUCTION EXPERIENCE 004 · Pre-Preparations"
                : mode === "adapt"
                  ? "PRODUCTION EXPERIENCE 003 · Production Adaptation"
                  : mode === "search"
                    ? "PRODUCTION EXPERIENCE 002 · Production Search"
                    : "PRODUCTION EXPERIENCE 001 · Production Planning"
        }
        title={
          mode === "handoff"
            ? "Zero Friction Kitchen Handoff"
            : mode === "alerts"
              ? "Zero Friction Production Alerts & Deadlines"
              : mode === "preps"
                ? "Zero Friction Production Pre-Preparations"
                : mode === "adapt"
                  ? "Zero Friction Production Adaptation"
                  : mode === "search"
                    ? "Zero Friction Production Search"
                    : "Zero Friction Production Planning"
        }
        subtitle={
          mode === "handoff"
            ? "Transferencia de responsabilidad — Kitchen no replanifica"
            : mode === "alerts"
              ? "Riesgos y deadlines visibles antes de Kitchen"
              : mode === "preps"
                ? "Qué debe prepararse antes del día de cocina — sin sorpresas"
                : mode === "adapt"
                  ? "Ajusta el plan vivo sin regenerarlo desde cero"
                  : mode === "search"
                    ? "Encuentra día · carga · lote · alerta · prep en segundos"
                    : "Semana publicada → trabajo ejecutable → Kitchen"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "handoff" ? (
          <StatusChip tone="warning" label="TPKH < 5 min" />
        ) : mode === "alerts" ? (
          <StatusChip tone="warning" label="TTPR < 10 s" />
        ) : mode === "preps" ? (
          <StatusChip tone="warning" label="TIRP < 15 s" />
        ) : mode === "adapt" ? (
          <StatusChip tone="warning" label="TAPP < 5 min" />
        ) : mode === "search" ? (
          <StatusChip tone="warning" label="TTFPW < 10 s" />
        ) : (
          <StatusChip tone="warning" label="TPP < 10 min" />
        )}
        <StatusChip
          tone="info"
          label="Semana → Día → Trabajo → Cantidad → Deadline → Kitchen"
        />
        <StatusChip tone="info" label="Experience only" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("search")}
        >
          Búsqueda
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("planning", focusWeekStart ?? undefined)}
        >
          Planificación
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("adapt", focusWeekStart ?? undefined)}
        >
          Adaptación
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("preps", focusWeekStart ?? undefined)}
        >
          Preps
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("alerts", focusWeekStart ?? undefined)}
        >
          Alertas
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("handoff", focusWeekStart ?? undefined)}
        >
          Handoff
        </button>
        <Link
          to="/admin/menu-planning"
          search={{ mode: "publish", weekStart: undefined }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Menu Planning
        </Link>
        <Link
          to="/admin/kitchen"
          className="text-xs underline-offset-2 hover:underline"
        >
          Kitchen
        </Link>
      </div>

      <AdminHeader
        goal={
          mode === "handoff"
            ? "Preparar el Kitchen Handoff en <5 min"
            : mode === "alerts"
              ? "Detectar riesgos de producción en <10s"
              : mode === "preps"
                ? "Identificar pre-preparaciones requeridas en <15s"
                : mode === "adapt"
                  ? "Adaptar el plan de producción en <5 min sin regenerarlo"
                  : mode === "search"
                    ? "Localizar el bloque de producción correcto en <10s"
                    : "Transformar una semana publicada en plan de producción en <10 min"
        }
        capability="production.operate · menus (published source)"
        object="Kitchen handoff · alerts · preps · adaptation · search · planning · session honesty"
      />

      {mode === "search" ? (
        <ProductionSearchPanel
          canWrite={canWrite}
          onOpenWork={(weekStart) => goMode("adapt", weekStart)}
          onOpenPlanning={() => goMode("planning")}
        />
      ) : mode === "adapt" ? (
        <ProductionAdaptationPanel
          key={`adapt-${focusWeekStart ?? "x"}`}
          canWrite={canWrite}
          weekStart={focusWeekStart}
          onOpenKitchen={(weekStart) => goMode("handoff", weekStart)}
          onBackToSearch={() => goMode("search")}
        />
      ) : mode === "preps" ? (
        <ProductionPrepsPanel
          key={`preps-${focusWeekStart ?? "x"}`}
          canWrite={canWrite}
          weekStart={focusWeekStart}
          onOpenRelatedWork={(weekStart) => goMode("adapt", weekStart)}
          onBackToPlanning={() => goMode("planning")}
        />
      ) : mode === "alerts" ? (
        <ProductionAlertsPanel
          key={`alerts-${focusWeekStart ?? "x"}`}
          canWrite={canWrite}
          weekStart={focusWeekStart}
          onNavigate={onAlertNavigate}
        />
      ) : mode === "handoff" ? (
        <ProductionHandoffPanel
          key={`handoff-${focusWeekStart ?? "x"}`}
          canWrite={canWrite}
          weekStart={focusWeekStart}
          onNavigate={onHandoffNavigate}
        />
      ) : (
        <ProductionPlanningPanel
          key={focusWeekStart ?? "plan"}
          canWrite={canWrite}
          focusWeekStart={focusWeekStart}
        />
      )}
    </div>
  );
}
