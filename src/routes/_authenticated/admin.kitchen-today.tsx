/**
 * KITCHEN EXPERIENCE 001 · 002
 * Today's Work · Execution Search
 *
 * Experience only — no Kitchen / Production Capability · Facade · Engine changes.
 * Start / Pause / Resume / Block / Assign → Future.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { KitchenSearchPanel } from "@/kitchen-experience/KitchenSearchPanel";
import { KitchenTodayPanel } from "@/kitchen-experience/KitchenTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode = "today" | "search";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return value === "today" || value === "search";
}

export const Route = createFileRoute("/_authenticated/admin/kitchen-today")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenTodayExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: isExperienceMode(search.mode) ? search.mode : ("today" as const),
    day: typeof search.day === "string" ? search.day : undefined,
    workId: typeof search.workId === "string" ? search.workId : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Kitchen Experience · Search · Today's Work",
      },
      {
        name: "description",
        content:
          "KITCHEN EXPERIENCE 002 Execution Search · 001 Today's Work · TTFEW <10s",
      },
    ],
  }),
});

function KitchenTodayExperiencePage() {
  const { can } = useCan();
  const canWrite = can("kitchen.operate");
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const [mode, setMode] = useState<ExperienceMode>(() =>
    isExperienceMode(searchParams.mode) ? searchParams.mode : "today",
  );
  const [dayDate, setDayDate] = useState(
    searchParams.day ?? utcDateOnly(),
  );
  const [focusWorkId, setFocusWorkId] = useState<string | null>(
    searchParams.workId ?? null,
  );

  function goMode(next: ExperienceMode, day?: string, workId?: string) {
    setMode(next);
    if (day) setDayDate(day);
    if (workId !== undefined) setFocusWorkId(workId || null);
    void navigate({
      to: "/admin/kitchen-today",
      search: {
        mode: next,
        day: day ?? dayDate,
        workId: workId || undefined,
      },
    });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "search"
            ? "KITCHEN EXPERIENCE 002 · Execution Search"
            : "KITCHEN EXPERIENCE 001 · Today's Work"
        }
        title={
          mode === "search"
            ? "Zero Friction Kitchen Execution Search"
            : "Zero Friction Kitchen Execution"
        }
        subtitle={
          mode === "search"
            ? "Encuentra trabajo de ejecución sin salir del contexto"
            : "Recibe el handoff — entiende qué ejecutar ahora"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "search" ? (
          <StatusChip tone="warning" label="TTFEW < 10 s" />
        ) : (
          <StatusChip tone="warning" label="TTUKW < 10 s" />
        )}
        <StatusChip tone="info" label="Handoff → Ejecución" />
        <StatusChip tone="info" label="Experience only" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("today", dayDate)}
        >
          Today's Work
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("search", dayDate)}
        >
          Búsqueda
        </button>
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
        goal={
          mode === "search"
            ? "Encontrar trabajo de ejecución en <10s"
            : "Entender el trabajo de cocina de hoy en <10s"
        }
        capability="kitchen.operate · production handoff (read)"
        object="Execution search · today's work · session honesty · no Capability Start"
      />

      {mode === "search" ? (
        <KitchenSearchPanel
          dayDate={dayDate}
          onOpenWork={(day, workId) => goMode("today", day, workId)}
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : (
        <KitchenTodayPanel
          canWrite={canWrite}
          dayDate={dayDate}
          focusWorkId={focusWorkId}
        />
      )}
    </div>
  );
}
