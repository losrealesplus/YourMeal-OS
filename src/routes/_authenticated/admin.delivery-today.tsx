/**
 * DELIVERY EXPERIENCE 001 · Zero Friction Delivery Day
 * DELIVERY EXPERIENCE 002 · Zero Friction Delivery Search
 * DELIVERY EXPERIENCE 003 · Zero Friction Delivery Adaptation
 * DELIVERY EXPERIENCE 004 · Zero Friction Delivery Responsibility
 * DELIVERY EXPERIENCE 005 · Zero Friction Route Preparation
 * DELIVERY EXPERIENCE 006 · Zero Friction Delivery Completion
 * Day · Search · Adaptation · Responsibility · Route Preparation · Completion
 *
 * Experience only — no Capability invent · Route Preparation ≠ Optimization ·
 * ConfirmDelivery only via existing Facade · no POD / Billing invent.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { DeliveryAdaptationPanel } from "@/delivery-experience/DeliveryAdaptationPanel";
import { DeliveryCompletionPanel } from "@/delivery-experience/DeliveryCompletionPanel";
import { DeliveryResponsibilityPanel } from "@/delivery-experience/DeliveryResponsibilityPanel";
import { DeliveryRoutePreparationPanel } from "@/delivery-experience/DeliveryRoutePreparationPanel";
import { DeliverySearchPanel } from "@/delivery-experience/DeliverySearchPanel";
import { DeliveryTodayPanel } from "@/delivery-experience/DeliveryTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode =
  | "today"
  | "search"
  | "adapt"
  | "responsibility"
  | "route"
  | "completion";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return (
    value === "today" ||
    value === "search" ||
    value === "adapt" ||
    value === "responsibility" ||
    value === "route" ||
    value === "completion"
  );
}

export const Route = createFileRoute("/_authenticated/admin/delivery-today")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: DeliveryTodayExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: isExperienceMode(search.mode) ? search.mode : ("today" as const),
    day: typeof search.day === "string" ? search.day : undefined,
    deliveryId:
      typeof search.deliveryId === "string" ? search.deliveryId : undefined,
  }),
  head: () => ({
    meta: [
      {
        title:
          "YourMeal OS — Delivery Experience · Completion · Route Prep · Day",
      },
      {
        name: "description",
        content:
          "DELIVERY EXPERIENCE 006 Completion · TTDO <5s · ConfirmDelivery via Facade · no POD/Billing invent",
      },
    ],
  }),
});

function DeliveryTodayExperiencePage() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const [mode, setMode] = useState<ExperienceMode>(() =>
    isExperienceMode(searchParams.mode) ? searchParams.mode : "today",
  );
  const [dayDate, setDayDate] = useState(
    searchParams.day ?? utcDateOnly(),
  );
  const [focusDeliveryId, setFocusDeliveryId] = useState<string | null>(
    searchParams.deliveryId ?? null,
  );

  function goMode(next: ExperienceMode, day?: string, deliveryId?: string) {
    setMode(next);
    if (day) setDayDate(day);
    if (deliveryId !== undefined) setFocusDeliveryId(deliveryId || null);
    void navigate({
      to: "/admin/delivery-today",
      search: {
        mode: next,
        day: day ?? dayDate,
        deliveryId: deliveryId || undefined,
      },
    });
  }

  const meta: Record<
    ExperienceMode,
    { overline: string; title: string; subtitle: string; kpi: string; goal: string }
  > = {
    today: {
      overline: "Operaciones · Reparto",
      title: "Jornada de Reparto de Hoy",
      subtitle: "Organización y control de las entregas del día.",
      kpi: "TTUDD < 2 min",
      goal: "Organización y seguimiento de las entregas de hoy.",
    },
    search: {
      overline: "Operaciones · Reparto",
      title: "Búsqueda de Entregas",
      subtitle: "Encuentra entregas de la jornada rápidamente.",
      kpi: "TTFD < 10 s",
      goal: "Búsqueda ágil de entregas en la jornada.",
    },
    adapt: {
      overline: "Operaciones · Reparto",
      title: "Adaptación de Entregas",
      subtitle: "Ajustes y cambios sobre la jornada de reparto.",
      kpi: "TTAD < 30 s",
      goal: "Adaptar incidencias de entrega sin alterar pedidos.",
    },
    responsibility: {
      overline: "Operaciones · Reparto",
      title: "Responsabilidad de Reparto",
      subtitle: "Asignación y estado de conductores y rutas.",
      kpi: "TTDR < 10 s",
      goal: "Revisión de asignaciones de reparto.",
    },
    route: {
      overline: "Operaciones · Reparto",
      title: "Preparación de Rutas",
      subtitle: "Secuencia y preparación de paradas de entrega.",
      kpi: "TPDD < 5 min",
      goal: "Preparación y orden de paradas para reparto.",
    },
    completion: {
      overline: "Operaciones · Reparto",
      title: "Cierre de Reparto",
      subtitle: "Resumen de entregas completadas e incidencias.",
      kpi: "TTDO < 5 s",
      goal: "Cierre y balance de la jornada de reparto.",
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
        <StatusChip tone="info" label="Cocina → Reparto" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goMode("today", dayDate)}
        >
          Today's Deliveries
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
          onClick={() => goMode("adapt", dayDate, focusDeliveryId ?? undefined)}
        >
          Adaptación
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() =>
            goMode("responsibility", dayDate, focusDeliveryId ?? undefined)
          }
        >
          Responsabilidad
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() =>
            goMode("route", dayDate, focusDeliveryId ?? undefined)
          }
        >
          Preparación de jornada
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() =>
            goMode("completion", dayDate, focusDeliveryId ?? undefined)
          }
        >
          Cierre
        </button>
        <Link
          to="/admin/kitchen-today"
          search={{ mode: "completion", day: dayDate, workId: undefined }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Kitchen Completion
        </Link>
        <Link
          to="/admin/order-capture"
          search={{
            mode: "search",
            customerId: undefined,
            kind: undefined,
          }}
          className="text-xs underline-offset-2 hover:underline"
        >
          Orders
        </Link>
        <Link
          to="/admin/delivery-workspace"
          className="text-xs underline-offset-2 hover:underline"
        >
          Delivery Workspace (Demo)
        </Link>
      </div>

      <AdminHeader
        goal={m.goal}
        capability="logistics.operate · Delivery Facade (read + ConfirmDelivery) · Order (consume)"
        object="Completion · route prep (session) · responsibility · adaptation · search · day · no POD/Billing invent"
      />

      {mode === "completion" ? (
        <DeliveryCompletionPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
          onOpenDelivery={(day, deliveryId) =>
            goMode("today", day, deliveryId)
          }
          onOpenRoute={(day) => goMode("route", day)}
          onOpenResponsibility={(day, deliveryId) =>
            goMode("responsibility", day, deliveryId)
          }
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : mode === "route" ? (
        <DeliveryRoutePreparationPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
          onOpenDelivery={(day, deliveryId) =>
            goMode("today", day, deliveryId)
          }
          onOpenResponsibility={(day, deliveryId) =>
            goMode("responsibility", day, deliveryId)
          }
          onBackToToday={() => goMode("today", dayDate)}
          onContinueToCompletion={(day) => goMode("completion", day)}
        />
      ) : mode === "responsibility" ? (
        <DeliveryResponsibilityPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
          onOpenDelivery={(day, deliveryId) =>
            goMode("today", day, deliveryId)
          }
          onBackToToday={() => goMode("today", dayDate)}
          onContinueToRoutePrep={(day) => goMode("route", day)}
        />
      ) : mode === "adapt" ? (
        <DeliveryAdaptationPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : mode === "search" ? (
        <DeliverySearchPanel
          dayDate={dayDate}
          onOpenDelivery={(day, deliveryId) =>
            goMode("today", day, deliveryId)
          }
          onBackToToday={() => goMode("today", dayDate)}
        />
      ) : (
        <DeliveryTodayPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
        />
      )}
    </div>
  );
}
