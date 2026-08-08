/**
 * PRODUCTION EXPERIENCE 001 · Zero Friction Production Planning
 *
 * Grammar: Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
 * Source: published operational week (Menu Experience).
 * Experience only — no Production Capability / Facade / Engine changes.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { ProductionPlanningPanel } from "@/production-experience/ProductionPlanningPanel";

export const Route = createFileRoute(
  "/_authenticated/admin/production-planning",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionPlanningExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    weekStart:
      typeof search.weekStart === "string" ? search.weekStart : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Production Experience · Planning",
      },
      {
        name: "description",
        content:
          "PRODUCTION EXPERIENCE 001 · Zero Friction Production Planning · TPP <10 min",
      },
    ],
  }),
});

function ProductionPlanningExperiencePage() {
  const { can } = useCan();
  const canWrite = can("production.operate");
  const searchParams = Route.useSearch();

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline="PRODUCTION EXPERIENCE 001 · Production Planning"
        title="Zero Friction Production Planning"
        subtitle="Semana publicada → trabajo ejecutable → Kitchen"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip tone="warning" label="TPP < 10 min" />
        <StatusChip
          tone="info"
          label="Semana → Día → Trabajo → Cantidad → Deadline → Kitchen"
        />
        <StatusChip tone="info" label="Experience only" />
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
        goal="Transformar una semana publicada en plan de producción en <10 min"
        capability="production.operate · menus (published source)"
        object="Production planning · published week · Kitchen handoff · session honesty"
      />

      <ProductionPlanningPanel
        canWrite={canWrite}
        focusWeekStart={searchParams.weekStart ?? null}
      />
    </div>
  );
}
