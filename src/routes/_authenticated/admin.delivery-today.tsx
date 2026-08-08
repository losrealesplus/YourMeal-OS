/**
 * DELIVERY EXPERIENCE 001
 * Today's Delivery Day — Zero Friction Delivery Day
 *
 * Experience only — no Delivery Capability invent · no routes · no maps ·
 * no navigation · no ConfirmDelivery · no durable assignment simulation.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { DeliveryTodayPanel } from "@/delivery-experience/DeliveryTodayPanel";
import { utcDateOnly } from "@/menu-experience/week-plan";

export const Route = createFileRoute("/_authenticated/admin/delivery-today")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: DeliveryTodayExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    day: typeof search.day === "string" ? search.day : undefined,
    deliveryId:
      typeof search.deliveryId === "string" ? search.deliveryId : undefined,
  }),
  head: () => ({
    meta: [
      {
        title:
          "YourMeal OS — Delivery Experience 001 · Today's Delivery Day",
      },
      {
        name: "description",
        content:
          "DELIVERY EXPERIENCE 001 · Zero Friction Delivery Day · TTUDD <2 min · no routes yet",
      },
    ],
  }),
});

function DeliveryTodayExperiencePage() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const [dayDate, setDayDate] = useState(
    searchParams.day ?? utcDateOnly(),
  );
  const [focusDeliveryId, setFocusDeliveryId] = useState<string | null>(
    searchParams.deliveryId ?? null,
  );

  function goDay(day: string, deliveryId?: string) {
    setDayDate(day);
    if (deliveryId !== undefined) setFocusDeliveryId(deliveryId || null);
    void navigate({
      to: "/admin/delivery-today",
      search: {
        day,
        deliveryId: deliveryId || undefined,
      },
    });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline="DELIVERY EXPERIENCE 001 · Today's Delivery Day"
        title="Zero Friction Delivery Day"
        subtitle="Prepara y entiende la jornada antes de que el conductor salga — sin mapas"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip tone="warning" label="TTUDD < 2 min" />
        <StatusChip tone="info" label="Kitchen → Delivery" />
        <StatusChip tone="info" label="Experience only" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => goDay(dayDate)}
        >
          Today's Deliveries
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
        <Link
          to="/admin/delivery"
          className="text-xs underline-offset-2 hover:underline"
        >
          Delivery (legacy)
        </Link>
      </div>

      <AdminHeader
        goal="Entender la jornada de entregas de hoy en <2 min · siguiente entrega <10s"
        capability="logistics.operate · Delivery Facade (read) · Order (consume)"
        object="Today's deliveries · readiness · warnings · no routes · no assignment invent"
      />

      <DeliveryTodayPanel
        dayDate={dayDate}
        focusDeliveryId={focusDeliveryId}
      />
    </div>
  );
}
