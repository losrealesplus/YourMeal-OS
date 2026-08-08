/**
 * DELIVERY EXPERIENCE 001–004
 * Today's Delivery Day · Search · Adaptation · Responsibility
 *
 * Experience only — no Delivery Capability invent · no routes · no maps ·
 * no navigation · no ConfirmDelivery · no durable assignment simulation.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { DeliveryAdaptationPanel } from "@/delivery-experience/DeliveryAdaptationPanel";
import { DeliveryResponsibilityPanel } from "@/delivery-experience/DeliveryResponsibilityPanel";
import { DeliverySearchPanel } from "@/delivery-experience/DeliverySearchPanel";
import { DeliveryTodayPanel } from "@/delivery-experience/DeliveryTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

type ExperienceMode = "today" | "search" | "adapt" | "responsibility";

function isExperienceMode(value: unknown): value is ExperienceMode {
  return (
    value === "today" ||
    value === "search" ||
    value === "adapt" ||
    value === "responsibility"
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
          "YourMeal OS — Delivery Experience · Responsibility · Adaptation · Search · Day",
      },
      {
        name: "description",
        content:
          "DELIVERY EXPERIENCE 004 Responsibility · TTDR <10s · 003 Adaptation · 002 Search · 001 Day · no fake AssignDelivery",
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
      overline: "DELIVERY EXPERIENCE 001 · Today's Delivery Day",
      title: "Zero Friction Delivery Day",
      subtitle:
        "Prepara y entiende la jornada antes de que el conductor salga — sin mapas",
      kpi: "TTUDD < 2 min",
      goal: "Entender la jornada de entregas de hoy en <2 min · siguiente entrega <10s",
    },
    search: {
      overline: "DELIVERY EXPERIENCE 002 · Delivery Search",
      title: "Zero Friction Delivery Search",
      subtitle:
        "Encuentra una entrega en la jornada sin salir del contexto operativo",
      kpi: "TTFD < 10 s",
      goal: "Encontrar la entrega correcta en <10s sin reconstruir Customer/Order",
    },
    adapt: {
      overline: "DELIVERY EXPERIENCE 003 · Delivery Adaptation",
      title: "Zero Friction Delivery Adaptation",
      subtitle:
        "Adapta el día cuando cambia la realidad — sin reescribir Order ni inventar rutas",
      kpi: "TTAD < 30 s",
      goal: "Adaptar en <30s · volver a la jornada en <5s · Order intacto",
    },
    responsibility: {
      overline: "DELIVERY EXPERIENCE 004 · Delivery Responsibility",
      title: "Zero Friction Delivery Responsibility",
      subtitle:
        "Quién es responsable · qué falta · sin simular AssignDelivery · Route Preparation NEXT",
      kpi: "TTDR < 10 s",
      goal: "Entender responsabilidad en <10s · identificar unassigned / unavailable en <10s",
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
        <StatusChip tone="info" label="Kitchen → Delivery" />
        <StatusChip tone="info" label="Experience only" />
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
        capability="logistics.operate · Delivery Facade (read) · Order (consume)"
        object="Responsibility · adaptation · search · day · session honesty · no AssignDelivery invent · no routes"
      />

      {mode === "responsibility" ? (
        <DeliveryResponsibilityPanel
          dayDate={dayDate}
          focusDeliveryId={focusDeliveryId}
          onOpenDelivery={(day, deliveryId) =>
            goMode("today", day, deliveryId)
          }
          onBackToToday={() => goMode("today", dayDate)}
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
