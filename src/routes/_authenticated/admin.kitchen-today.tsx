/**
 * KITCHEN EXPERIENCE 001–005
 * Today's Work · Search · Adaptation · Labels · Progress
 *
 * Experience only — no Kitchen / Production Capability · Facade · Engine changes.
 * Start / Pause / Resume / Block / Assign / Notify / Physical labels → Future.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { KitchenAdaptationPanel } from "@/kitchen-experience/KitchenAdaptationPanel";
import { KitchenLabelsPanel } from "@/kitchen-experience/KitchenLabelsPanel";
import { KitchenProgressPanel } from "@/kitchen-experience/KitchenProgressPanel";
import { KitchenSearchPanel } from "@/kitchen-experience/KitchenSearchPanel";
import { KitchenTodayPanel } from "@/kitchen-experience/KitchenTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode = "today" | "search" | "adapt" | "labels" | "progress";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return (
    value === "today" ||
    value === "search" ||
    value === "adapt" ||
    value === "labels" ||
    value === "progress"
  );
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
          "YourMeal OS — Kitchen Experience · Progress · Labels · Adaptation · Search · Today's Work",
      },
      {
        name: "description",
        content:
          "KITCHEN EXPERIENCE 005 Execution Progress · TTEP <5s · 004 Labels · 003 Adaptation · 002 Search · 001 Today's Work",
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
    mode === "progress"
      ? "KITCHEN EXPERIENCE 005 · Execution Progress"
      : mode === "labels"
        ? "KITCHEN EXPERIENCE 004 · Labels & Special Info"
        : mode === "adapt"
          ? "KITCHEN EXPERIENCE 003 · Execution Adaptation"
          : mode === "search"
            ? "KITCHEN EXPERIENCE 002 · Execution Search"
            : "KITCHEN EXPERIENCE 001 · Today's Work";

  const title =
    mode === "progress"
      ? "Zero Friction Kitchen Execution Progress"
      : mode === "labels"
        ? "Zero Friction Kitchen Labels & Special Information"
        : mode === "adapt"
          ? "Zero Friction Kitchen Execution Adaptation"
          : mode === "search"
            ? "Zero Friction Kitchen Execution Search"
            : "Zero Friction Kitchen Execution";

  const subtitle =
    mode === "progress"
      ? "Entiende qué queda sin inventar estado durable"
      : mode === "labels"
        ? "Identifica el trabajo y la info especial sin inventar substrate"
        : mode === "adapt"
          ? "Adapta la ejecución sin replanificar Production"
          : mode === "search"
            ? "Encuentra trabajo de ejecución sin salir del contexto"
            : "Recibe el handoff — entiende qué ejecutar ahora";

  const kpiChip =
    mode === "progress" ? (
      <StatusChip tone="warning" label="TTEP < 5 s" />
    ) : mode === "labels" ? (
      <StatusChip tone="warning" label="TILC < 10 s" />
    ) : mode === "adapt" ? (
      <StatusChip tone="warning" label="TTAE < 30 s" />
    ) : mode === "search" ? (
      <StatusChip tone="warning" label="TTFEW < 10 s" />
    ) : (
      <StatusChip tone="warning" label="TTUKW < 10 s" />
    );

  const goal =
    mode === "progress"
      ? "Entender progreso y trabajo restante en <5s"
      : mode === "labels"
        ? "Identificar contexto de etiqueta en <10s · info especial en <5s"
        : mode === "adapt"
          ? "Adaptar ejecución en <30s y volver a ejecutar en <5s"
          : mode === "search"
            ? "Encontrar trabajo de ejecución en <10s"
            : "Entender el trabajo de cocina de hoy en <10s";

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle overline={overline} title={title} subtitle={subtitle} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {kpiChip}
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
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("labels", dayDate, focusWorkId ?? undefined)}
        >
          Etiquetas
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("progress", dayDate, focusWorkId ?? undefined)}
        >
          Progreso
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
        goal={goal}
        capability="kitchen.operate · production handoff (read)"
        object="Progress · labels · adaptation · search · today's work · session honesty · no Capability invent"
      />

      {mode === "progress" ? (
        <KitchenProgressPanel
          dayDate={dayDate}
          focusWorkId={focusWorkId}
          onOpenWork={(day, workId) => goMode("today", day, workId)}
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : mode === "labels" ? (
        <KitchenLabelsPanel
          dayDate={dayDate}
          focusWorkId={focusWorkId}
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : mode === "adapt" ? (
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
