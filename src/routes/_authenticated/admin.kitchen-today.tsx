/**
 * KITCHEN EXPERIENCE 001 · Zero Friction Kitchen Execution
 * Today's Work — receive Production Handoff · understand · execute clarity
 *
 * Experience only — no Kitchen / Production Capability · Facade · Engine changes.
 * Start / Pause / Resume / Block / Assign → Future.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { KitchenTodayPanel } from "@/kitchen-experience/KitchenTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

export const Route = createFileRoute("/_authenticated/admin/kitchen-today")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenTodayExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    day: typeof search.day === "string" ? search.day : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Kitchen Experience · Today's Work",
      },
      {
        name: "description",
        content:
          "KITCHEN EXPERIENCE 001 Zero Friction Kitchen Execution · TTUKW <10s",
      },
    ],
  }),
});

function KitchenTodayExperiencePage() {
  const { can } = useCan();
  const canWrite = can("kitchen.operate");
  const searchParams = Route.useSearch();
  const [dayDate] = useState(searchParams.day ?? utcDateOnly());

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline="KITCHEN EXPERIENCE 001 · Today's Work"
        title="Zero Friction Kitchen Execution"
        subtitle="Recibe el handoff — entiende qué ejecutar ahora"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip tone="warning" label="TTUKW < 10 s" />
        <StatusChip tone="info" label="Handoff → Ejecución" />
        <StatusChip tone="info" label="Experience only" />
        <Link
          to="/admin/production-planning"
          search={{ mode: "handoff", weekStart: undefined }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Production Handoff
        </Link>
        <Link
          to="/admin/production-planning"
          search={{ mode: "planning", weekStart: undefined }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Production
        </Link>
        <Link
          to="/admin/kitchen"
          className="text-xs underline-offset-2 hover:underline"
        >
          Cocina (legacy)
        </Link>
      </div>

      <AdminHeader
        goal="Entender el trabajo de cocina de hoy en <10s"
        capability="kitchen.operate · production handoff (read)"
        object="Today's work · execution cards · session honesty · no Capability Start"
      />

      <KitchenTodayPanel canWrite={canWrite} dayDate={dayDate} />
    </div>
  );
}
