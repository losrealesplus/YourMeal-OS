/**
 * PRODUCTION EXPERIENCE 001 · PRODUCTION EXPERIENCE 002
 * Production Planning · Production Search
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
import { ProductionPlanningPanel } from "@/production-experience/ProductionPlanningPanel";
import { ProductionSearchPanel } from "@/production-experience/ProductionSearchPanel";

type ExperienceMode = "search" | "planning";

export const Route = createFileRoute(
  "/_authenticated/admin/production-planning",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search.mode === "planning" || search.mode === "search"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Production Experience · Search · Planning",
      },
      {
        name: "description",
        content:
          "PRODUCTION EXPERIENCE 002 Search · 001 Planning · TTFPW <10s · TPP <10 min",
      },
    ],
  }),
});

function ProductionPlanningExperiencePage() {
  const { can } = useCan();
  const canWrite = can("production.operate");
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const [mode, setMode] = useState<ExperienceMode>(
    searchParams.mode === "planning" ? "planning" : "search",
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
        weekStart: weekStart ?? focusWeekStart ?? undefined,
      },
    });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "search"
            ? "PRODUCTION EXPERIENCE 002 · Production Search"
            : "PRODUCTION EXPERIENCE 001 · Production Planning"
        }
        title={
          mode === "search"
            ? "Zero Friction Production Search"
            : "Zero Friction Production Planning"
        }
        subtitle={
          mode === "search"
            ? "Encuentra día · carga · lote · alerta · prep en segundos"
            : "Semana publicada → trabajo ejecutable → Kitchen"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "search" ? (
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
          mode === "search"
            ? "Localizar el bloque de producción correcto en <10s"
            : "Transformar una semana publicada en plan de producción en <10 min"
        }
        capability="production.operate · menus (published source)"
        object="Production search · planning · Kitchen handoff · session honesty"
      />

      {mode === "search" ? (
        <ProductionSearchPanel
          canWrite={canWrite}
          onOpenWork={(weekStart) => goMode("planning", weekStart)}
          onOpenPlanning={() => goMode("planning")}
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
