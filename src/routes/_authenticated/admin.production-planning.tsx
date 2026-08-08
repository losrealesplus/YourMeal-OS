/**
 * PRODUCTION EXPERIENCE 001 · 002 · 003 · 004
 * Planning · Search · Adaptation · Pre-Preparations
 *
 * Grammar: Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
 * Source: published operational week (Menu Experience).
 * Experience only — no Production Capability / Facade / Engine changes.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { ProductionAdaptationPanel } from "@/production-experience/ProductionAdaptationPanel";
import { ProductionPlanningPanel } from "@/production-experience/ProductionPlanningPanel";
import { ProductionPrepsPanel } from "@/production-experience/ProductionPrepsPanel";
import { ProductionSearchPanel } from "@/production-experience/ProductionSearchPanel";

type ExperienceMode = "search" | "planning" | "adapt" | "preps";

export const Route = createFileRoute(
  "/_authenticated/admin/production-planning",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search.mode === "planning" ||
      search.mode === "search" ||
      search.mode === "adapt" ||
      search.mode === "preps"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title:
          "YourMeal OS — Production Experience · Preps · Adaptation · Search",
      },
      {
        name: "description",
        content:
          "PRODUCTION EXPERIENCE 004 Pre-Preparations · 003 Adaptation · 002 Search · 001 Planning · TIRP <15s",
      },
    ],
  }),
});

function ProductionPlanningExperiencePage() {
  const { can } = useCan();
  const canWrite = can("production.operate");
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const [mode, setMode] = useState<ExperienceMode>(() => {
    if (
      searchParams.mode === "planning" ||
      searchParams.mode === "adapt" ||
      searchParams.mode === "search" ||
      searchParams.mode === "preps"
    ) {
      return searchParams.mode;
    }
    return "search";
  });
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
        weekStart: weekStart ?? focusWeekStart ?? undefined,
      },
    });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "preps"
            ? "PRODUCTION EXPERIENCE 004 · Pre-Preparations"
            : mode === "adapt"
              ? "PRODUCTION EXPERIENCE 003 · Production Adaptation"
              : mode === "search"
                ? "PRODUCTION EXPERIENCE 002 · Production Search"
                : "PRODUCTION EXPERIENCE 001 · Production Planning"
        }
        title={
          mode === "preps"
            ? "Zero Friction Production Pre-Preparations"
            : mode === "adapt"
              ? "Zero Friction Production Adaptation"
              : mode === "search"
                ? "Zero Friction Production Search"
                : "Zero Friction Production Planning"
        }
        subtitle={
          mode === "preps"
            ? "Qué debe prepararse antes del día de cocina — sin sorpresas"
            : mode === "adapt"
              ? "Ajusta el plan vivo sin regenerarlo desde cero"
              : mode === "search"
                ? "Encuentra día · carga · lote · alerta · prep en segundos"
                : "Semana publicada → trabajo ejecutable → Kitchen"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "preps" ? (
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
          mode === "preps"
            ? "Identificar pre-preparaciones requeridas en <15s"
            : mode === "adapt"
              ? "Adaptar el plan de producción en <5 min sin regenerarlo"
              : mode === "search"
                ? "Localizar el bloque de producción correcto en <10s"
                : "Transformar una semana publicada en plan de producción en <10 min"
        }
        capability="production.operate · menus (published source)"
        object="Production preps · adaptation · search · planning · session honesty"
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
          onOpenKitchen={(weekStart) => goMode("planning", weekStart)}
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
