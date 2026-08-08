/**
 * KITCHEN EXPERIENCE 001 · 002 · 003
 * Today's Work · Execution Search · Execution Adaptation
 *
 * Experience only — no Kitchen / Production Capability · Facade · Engine changes.
 * Start / Pause / Resume / Block / Assign / Notify → Future.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { KitchenAdaptationPanel } from "@/kitchen-experience/KitchenAdaptationPanel";
import { KitchenSearchPanel } from "@/kitchen-experience/KitchenSearchPanel";
import { KitchenTodayPanel } from "@/kitchen-experience/KitchenTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode = "today" | "search" | "adapt";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return value === "today" || value === "search" || value === "adapt";
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
        title:
          "YourMeal OS — Kitchen Experience · Adaptation · Search · Today's Work",
      },
      {
        name: "description",
        content:
          "KITCHEN EXPERIENCE 003 Execution Adaptation · TTAE <30s · 002 Search · 001 Today's Work",
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

  const overline =
    mode === "adapt"
      ? "KITCHEN EXPERIENCE 003 · Execution Adaptation"
      : mode === "search"
        ? "KITCHEN EXPERIENCE 002 · Execution Search"
        : "KITCHEN EXPERIENCE 001 · Today's Work";

  const title =
    mode === "adapt"
      ? "Zero Friction Kitchen Execution Adaptation"
      : mode === "search"
        ? "Zero Friction Kitchen Execution Search"
        : "Zero Friction Kitchen Execution";

  const subtitle =
    mode === "adapt"
      ? "Adapta la ejecución sin replanificar Production"
      : mode === "search"
        ? "Encuentra trabajo de ejecución sin salir del contexto"
        : "Recibe el handoff — entiende qué ejecutar ahora";

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle overline={overline} title={title} subtitle={subtitle} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "adapt" ? (
          <StatusChip tone="warning" label="TTAE < 30 s" />
        ) : mode === "search" ? (
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
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("adapt", dayDate, focusWorkId ?? undefined)}
        >
          Adaptación
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
          mode === "adapt"
            ? "Adaptar ejecución en <30s y volver a ejecutar en <5s"
            : mode === "search"
              ? "Encontrar trabajo de ejecución en <10s"
              : "Entender el trabajo de cocina de hoy en <10s"
        }
        capability="kitchen.operate · production handoff (read)"
        object="Execution adaptation · search · today's work · session honesty · no Capability Start"
      />

      {mode === "adapt" ? (
        <KitchenAdaptationPanel
          canWrite={canWrite}
          dayDate={dayDate}
          focusWorkId={focusWorkId}
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : mode === "search" ? (
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
