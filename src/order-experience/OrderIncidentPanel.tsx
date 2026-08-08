/**
 * OE005 — Zero Friction Operational Incident panel (Experience only).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import type { OrderSearchHit } from "@/order-experience/OrderSearchPanel";
import { formatDayLabel } from "@/order-experience/operational-commitments";
import {
  INCIDENT_ROUTE_LABEL,
  INCIDENT_STATUS_LABEL,
  INCIDENT_TYPE_LABEL,
  listOperationalIncidents,
  routeOperationalIncident,
  saveOperationalIncident,
  suggestedRoute,
  type IncidentPriority,
  type IncidentRoute,
  type IncidentType,
  type OperationalIncident,
} from "@/order-experience/operational-incidents";
import { cn } from "@/lib/utils";

type Props = {
  hit: OrderSearchHit | null;
  canWrite: boolean;
  onClose: () => void;
  onOpenOrder?: () => void;
};

const TYPES = Object.keys(INCIDENT_TYPE_LABEL) as IncidentType[];
const ROUTES = Object.keys(INCIDENT_ROUTE_LABEL) as IncidentRoute[];

export function OrderIncidentPanel({
  hit,
  canWrite,
  onClose,
  onOpenOrder,
}: Props) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState<IncidentType>("customer_change");
  const [route, setRoute] = useState<IncidentRoute>(
    suggestedRoute("customer_change"),
  );
  const [priority, setPriority] = useState<IncidentPriority>("normal");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState<OperationalIncident | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRoute(suggestedRoute(type));
  }, [type]);

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  const existing = useMemo(() => {
    void tick;
    return hit ? listOperationalIncidents(hit.id) : listOperationalIncidents();
  }, [hit, tick]);

  function record(andRoute: boolean) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    if (!hit) {
      toast.error("Selecciona un pedido desde Búsqueda");
      return;
    }
    if (!notes.trim()) {
      toast.error("Añade una nota breve");
      noteRef.current?.focus();
      return;
    }
    const customerId =
      hit.session?.customerId ?? hit.facadeSummary?.partyRef.id ?? "";
    if (!customerId) {
      toast.error("No se pudo asociar al cliente");
      return;
    }
    const row = saveOperationalIncident({
      orderRef: hit.id,
      orderSource: hit.source === "session" ? "session" : "facade",
      customerId,
      customerName: hit.customerName,
      deliveryDay: hit.deliveryDay ?? null,
      deliveryArea: hit.area ?? null,
      type,
      route,
      priority,
      notes: notes.trim(),
      status: andRoute ? "routed" : "recorded",
    });
    setCreated(row);
    setTick((n) => n + 1);
    toast.success(
      andRoute
        ? `Incidencia derivada a ${INCIDENT_ROUTE_LABEL[route]}`
        : "Incidencia registrada",
    );
  }

  function reRoute(id: string, next: IncidentRoute) {
    const updated = routeOperationalIncident(id, next);
    if (!updated) return;
    setCreated(updated);
    setTick((n) => n + 1);
    toast.success(`Derivada a ${INCIDENT_ROUTE_LABEL[next]}`);
  }

  if (!hit && !created) {
    return (
      <section className="space-y-3" aria-labelledby="oe-incident">
        <h2 id="oe-incident" className="text-sm font-semibold tracking-wide">
          Incidencia operativa
        </h2>
        <p className="text-sm">Selecciona un pedido en Búsqueda para reportar.</p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-md bg-foreground px-4 text-sm text-background"
        >
          Ir a búsqueda
        </button>
      </section>
    );
  }

  if (created) {
    return (
      <section className="space-y-4" aria-labelledby="oe-incident-done" aria-live="polite">
        <h2 id="oe-incident-done" className="text-sm font-semibold tracking-wide">
          Incidencia registrada
        </h2>
        <p className="text-lg font-medium">{created.customerName}</p>
        <p className="text-sm text-muted-foreground">
          {INCIDENT_TYPE_LABEL[created.type]} ·{" "}
          {INCIDENT_ROUTE_LABEL[created.route]} ·{" "}
          {INCIDENT_STATUS_LABEL[created.status]}
        </p>
        <p className="text-sm">{created.notes}</p>
        <StatusChip
          tone={created.status === "routed" ? "positive" : "warning"}
          label={INCIDENT_STATUS_LABEL[created.status]}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">¿Qué quieres hacer ahora?</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {created.route === "kitchen" || created.route === "production" ? (
              <Link
                to="/admin/kitchen-workspace"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                Notificar cocina
              </Link>
            ) : null}
            {created.route === "delivery" ? (
              <Link
                to="/admin/delivery-workspace"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                Notificar reparto
              </Link>
            ) : null}
            {created.route === "production" ? (
              <Link
                to="/admin/production-workspace"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
              >
                Abrir producción
              </Link>
            ) : null}
            <Link
              to="/admin/customer-workspace"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Abrir cliente
            </Link>
            {onOpenOrder ? (
              <button
                type="button"
                onClick={onOpenOrder}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
              >
                Abrir pedido
              </button>
            ) : (
              <Link
                to="/admin/order-workspace"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
              >
                Abrir pedido
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a búsqueda
            </button>
            <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
              OCC → Reserved
            </span>
          </div>
          {created.status === "recorded" ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <p className="w-full text-xs text-muted-foreground">
                Derivar ahora (&lt;10s):
              </p>
              {ROUTES.filter((r) => !r.endsWith("_future")).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => reRoute(created.id, r)}
                  className="min-h-10 rounded-md border border-border px-3 text-xs"
                >
                  {INCIDENT_ROUTE_LABEL[r]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const context = hit!;

  return (
    <section className="space-y-4" aria-labelledby="oe-incident">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="oe-incident" className="text-sm font-semibold tracking-wide">
            Reportar incidencia
          </h2>
          <p className="text-lg font-medium">{context.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {context.deliveryDay
              ? formatDayLabel(context.deliveryDay)
              : "Sin día"}
            {context.area ? ` · ${context.area}` : ""}
            {` · ${context.itemCount} ítems`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline-offset-2 hover:underline"
        >
          Cancelar
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                type === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              {INCIDENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Derivar a</legend>
        <div className="flex flex-wrap gap-2">
          {ROUTES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoute(r)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                route === r
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
                r.endsWith("_future") && "opacity-60",
              )}
            >
              {INCIDENT_ROUTE_LABEL[r]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Prioridad</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["normal", "Normal"],
              ["high", "Alta"],
              ["urgent", "Urgente"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPriority(key)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                priority === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="oe-incident-notes" className="text-sm font-semibold">
          Nota
        </label>
        <textarea
          id="oe-incident-notes"
          ref={noteRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Qué pasó · qué necesita el equipo…"
          className="w-full rounded-md border border-border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => record(true)}
          className="min-h-12 flex-1 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          Registrar y derivar
        </button>
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => record(false)}
          className="min-h-12 rounded-md border border-border px-4 text-sm disabled:opacity-40"
        >
          Solo registrar
        </button>
      </div>

      {existing.length > 0 ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Incidencias de este pedido
          </p>
          <ul className="space-y-1 text-sm">
            {existing.slice(0, 5).map((i) => (
              <li key={i.id} className="text-muted-foreground">
                {INCIDENT_TYPE_LABEL[i.type]} ·{" "}
                {INCIDENT_STATUS_LABEL[i.status]} · {INCIDENT_ROUTE_LABEL[i.route]}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sin incidencias previas en este pedido.
        </p>
      )}
    </section>
  );
}
