/**
 * PRODUCTION EXPERIENCE 001 · 002 · 003
 * Production Planning · Search · Adaptation
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
import { ProductionSearchPanel } from "@/production-experience/ProductionSearchPanel";

type ExperienceMode = "search" | "planning" | "adapt";

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
      search.mode === "adapt"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title:
          "YourMeal OS — Production Experience · Adaptation · Search · Planning",
      },
      {
        name: "description",
        content:
          "PRODUCTION EXPERIENCE 003 Adaptation · 002 Search · 001 Planning · TAPP <5 min",
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
      searchParams.mode === "search"
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
          mode === "adapt"
            ? "PRODUCTION EXPERIENCE 003 · Production Adaptation"
            : mode === "search"
              ? "PRODUCTION EXPERIENCE 002 · Production Search"
              : "PRODUCTION EXPERIENCE 001 · Production Planning"
        }
        title={
          mode === "adapt"
            ? "Zero Friction Production Adaptation"
            : mode === "search"
              ? "Zero Friction Production Search"
              : "Zero Friction Production Planning"
        }
        subtitle={
          mode === "adapt"
            ? "Ajusta el plan vivo sin regenerarlo desde cero"
            : mode === "search"
              ? "Encuentra día · carga · lote · alerta · prep en segundos"
              : "Semana publicada → trabajo ejecutable → Kitchen"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "adapt" ? (
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
        <Link
          to="/admin/production-workspace"
          className="text-xs underline-offset-2 hover:underline"
        >
          Production demo (Capability)
        </Link>
      </div>

      <AdminHeader
        goal={
          mode === "adapt"
            ? "Adaptar el plan de producción en <5 min sin regenerarlo"
            : mode === "search"
              ? "Localizar el bloque de producción correcto en <10s"
              : "Transformar una semana publicada en plan de producción en <10 min"
        }
        capability="production.operate · menus (published source)"
        object="Production adaptation · search · planning · Kitchen handoff · session honesty"
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
