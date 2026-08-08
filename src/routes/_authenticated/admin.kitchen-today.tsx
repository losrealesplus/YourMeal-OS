/**
 * KITCHEN EXPERIENCE 001–006
 * Today's Work · Search · Adaptation · Labels · Progress · Completion
 *
 * Experience only — no Kitchen / Production / Delivery Capability invent.
 * Start / Pause / Resume / Block / Assign / Complete durable / Delivery → Future.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCan } from "@/hooks/use-can";
import { KitchenAdaptationPanel } from "@/kitchen-experience/KitchenAdaptationPanel";
import { KitchenCompletionPanel } from "@/kitchen-experience/KitchenCompletionPanel";
import { KitchenLabelsPanel } from "@/kitchen-experience/KitchenLabelsPanel";
import { KitchenProgressPanel } from "@/kitchen-experience/KitchenProgressPanel";
import { KitchenSearchPanel } from "@/kitchen-experience/KitchenSearchPanel";
import { KitchenTodayPanel } from "@/kitchen-experience/KitchenTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode =
  | "today"
  | "search"
  | "adapt"
  | "labels"
  | "progress"
  | "completion";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return (
    value === "today" ||
    value === "search" ||
    value === "adapt" ||
    value === "labels" ||
    value === "progress" ||
    value === "completion"
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
          "YourMeal OS — Kitchen Experience · Completion · Progress · Labels · Adaptation · Search · Today's Work",
      },
      {
        name: "description",
        content:
          "KITCHEN EXPERIENCE 006 Completion & Handoff · TTUC <5s · 005 Progress · 004 Labels · 003 Adaptation · 002 Search · 001 Today's Work",
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

  const meta: Record<
    ExperienceMode,
    { overline: string; title: string; subtitle: string; kpi: string; goal: string }
  > = {
    today: {
      overline: "KITCHEN EXPERIENCE 001 · Today's Work",
      title: "Zero Friction Kitchen Execution",
      subtitle: "Recibe el handoff — entiende qué ejecutar ahora",
      kpi: "TTUKW < 10 s",
      goal: "Entender el trabajo de cocina de hoy en <10s",
    },
    search: {
      overline: "KITCHEN EXPERIENCE 002 · Execution Search",
      title: "Zero Friction Kitchen Execution Search",
      subtitle: "Encuentra trabajo de ejecución sin salir del contexto",
      kpi: "TTFEW < 10 s",
      goal: "Encontrar trabajo de ejecución en <10s",
    },
    adapt: {
      overline: "KITCHEN EXPERIENCE 003 · Execution Adaptation",
      title: "Zero Friction Kitchen Execution Adaptation",
      subtitle: "Adapta la ejecución sin replanificar Production",
      kpi: "TTAE < 30 s",
      goal: "Adaptar ejecución en <30s y volver a ejecutar en <5s",
    },
    labels: {
      overline: "KITCHEN EXPERIENCE 004 · Labels & Special Info",
      title: "Zero Friction Kitchen Labels & Special Information",
      subtitle: "Identifica el trabajo y la info especial sin inventar substrate",
      kpi: "TILC < 10 s",
      goal: "Identificar contexto de etiqueta en <10s · info especial en <5s",
    },
    progress: {
      overline: "KITCHEN EXPERIENCE 005 · Execution Progress",
      title: "Zero Friction Kitchen Execution Progress",
      subtitle: "Entiende qué queda sin inventar estado durable",
      kpi: "TTEP < 5 s",
      goal: "Entender progreso y trabajo restante en <5s",
    },
    completion: {
      overline: "KITCHEN EXPERIENCE 006 · Completion & Handoff",
      title: "Zero Friction Kitchen Completion & Handoff",
      subtitle: "Cierra el día con honestidad — Delivery → Future",
      kpi: "TTUC < 5 s",
      goal: "Entender cierre en <5s · preparar siguiente paso en <10s",
    },
  };

  const m = meta[mode];

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={m.overline}
        title={m.title}
        subtitle={m.subtitle}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip tone="warning" label={m.kpi} />
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
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() =>
            goMode("completion", dayDate, focusWorkId ?? undefined)
          }
        >
          Cierre
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
        goal={m.goal}
        capability="kitchen.operate · production handoff (read)"
        object="Completion · progress · labels · adaptation · search · today's work · session honesty · no Delivery invent"
      />

      {mode === "completion" ? (
        <KitchenCompletionPanel
          dayDate={dayDate}
          focusWorkId={focusWorkId}
          onOpenWork={(day, workId) => goMode("today", day, workId)}
          onBackToToday={() => goMode("today", dayDate)}
          onOpenProgress={() => goMode("progress", dayDate)}
        />
      ) : mode === "progress" ? (
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
