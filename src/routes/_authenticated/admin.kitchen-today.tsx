/**
 * KITCHEN EXPERIENCE 001 · Zero Friction Kitchen Execution
 * KITCHEN EXPERIENCE 002 · Zero Friction Kitchen Execution Search
 * KITCHEN EXPERIENCE 003 · Zero Friction Kitchen Execution Adaptation
 * KITCHEN EXPERIENCE 004 · Zero Friction Kitchen Labels & Special Information
 * KITCHEN EXPERIENCE 005 · Zero Friction Kitchen Execution Progress
 * KITCHEN EXPERIENCE 006 · Zero Friction Kitchen Completion & Handoff
 * Today · Search · Adaptation · Labels · Progress · Completion
 *
 * Execution facade only — no Kitchen Capability invent · no durable invent.
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
      overline: "Operaciones · Cocina",
      title: "Jornada de Cocina de Hoy",
      subtitle: "Trabajo y órdenes de preparación asignadas para hoy.",
      kpi: "TTUKW < 10 s",
      goal: "Seguimiento y control de la preparación en cocina.",
    },
    search: {
      overline: "Operaciones · Cocina",
      title: "Búsqueda en Cocina",
      subtitle: "Encuentra platos o preparaciones de la jornada.",
      kpi: "TTFEW < 10 s",
      goal: "Búsqueda de preparaciones en cocina.",
    },
    adapt: {
      overline: "Operaciones · Cocina",
      title: "Adaptación en Cocina",
      subtitle: "Ajustes sobre preparaciones y lotes del día.",
      kpi: "TTAE < 30 s",
      goal: "Adaptar preparación de platos.",
    },
    labels: {
      overline: "Operaciones · Cocina",
      title: "Etiquetas de Cocina",
      subtitle: "Información especial y etiquetado de porciones.",
      kpi: "TILC < 10 s",
      goal: "Control de etiquetado.",
    },
    progress: {
      overline: "Operaciones · Cocina",
      title: "Progreso de Cocina",
      subtitle: "Estado de avance de las preparaciones.",
      kpi: "TTEP < 5 s",
      goal: "Seguimiento del progreso de cocinado.",
    },
    completion: {
      overline: "Operaciones · Cocina",
      title: "Cierre de Cocina",
      subtitle: "Transferencia de platos terminados a reparto.",
      kpi: "TTUC < 5 s",
      goal: "Cierre de cocina y transferencia.",
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
        <StatusChip tone="info" label="Producción → Cocina" />
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
