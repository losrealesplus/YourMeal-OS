/**
 * OE004 — Zero Friction Order Templates panel (Experience only).
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  deleteOrderTemplate,
  listOrderTemplates,
  markTemplateUsed,
  templateSummary,
  type OrderTemplate,
} from "@/order-experience/order-templates";
import { formatDayLabel } from "@/order-experience/operational-commitments";
import { cn } from "@/lib/utils";

type Props = {
  customerId?: string;
  customerName?: string;
  canWrite: boolean;
  onApply: (template: OrderTemplate) => void;
  onCreateOrder: () => void;
  onBack: () => void;
};

export function OrderTemplatesPanel({
  customerId,
  customerName,
  canWrite,
  onApply,
  onCreateOrder,
  onBack,
}: Props) {
  const [filterMine, setFilterMine] = useState(Boolean(customerId));
  const [tick, setTick] = useState(0);

  const templates = useMemo(() => {
    void tick;
    return listOrderTemplates(filterMine && customerId ? customerId : undefined);
  }, [customerId, filterMine, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function handleApply(t: OrderTemplate) {
    markTemplateUsed(t.id);
    refresh();
    toast.success("Plantilla aplicada — adapta y confirma");
    onApply(t);
  }

  function handleDelete(id: string) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    deleteOrderTemplate(id);
    refresh();
    toast.success("Plantilla eliminada (sesión)");
  }

  return (
    <section className="space-y-4" aria-labelledby="oe-templates">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="oe-templates" className="text-sm font-semibold tracking-wide">
            Plantillas operativas
          </h2>
          <p className="text-xs text-muted-foreground">
            Patrones flexibles — no automatización rígida
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs underline-offset-2 hover:underline"
        >
          Volver
        </button>
      </div>

      {customerId ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterMine(true)}
            className={cn(
              "min-h-10 rounded-md border px-3 text-xs",
              filterMine
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {customerName ?? "Este cliente"}
          </button>
          <button
            type="button"
            onClick={() => setFilterMine(false)}
            className={cn(
              "min-h-10 rounded-md border px-3 text-xs",
              !filterMine
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            Todas
          </button>
        </div>
      ) : null}

      {templates.length === 0 ? (
        <div className="space-y-2 text-sm">
          <p>No hay plantillas todavía.</p>
          <p className="text-muted-foreground">
            Captura un pedido y elige «Guardar como plantilla», o crea uno
            nuevo.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreateOrder}
              className="inline-flex min-h-11 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Crear pedido
            </button>
            <Link
              to="/admin/customer-workspace"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm"
            >
              Abrir cliente
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-border px-3 py-3 space-y-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.customerName}
                    {t.preferredDeliveryDay
                      ? ` · ${formatDayLabel(t.preferredDeliveryDay)}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {templateSummary(t)}
                  </p>
                </div>
                <StatusChip
                  tone="info"
                  label={
                    t.useCount > 0 ? `${t.useCount}× usada` : t.source
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApply(t)}
                  className="inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-semibold text-background"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(t)}
                  className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold"
                >
                  Editar antes de confirmar
                </button>
                <Link
                  to="/admin/customer-workspace"
                  className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold"
                >
                  Abrir cliente
                </Link>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
