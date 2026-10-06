import { useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCustomOrderCapture } from "@/hooks/use-custom-order-capture";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  loadCustomCaptureSource,
  previewCustomCaptureRepeat,
  type CustomCaptureSourceOrder,
} from "@/modules/orders/application/custom-order-capture-service";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
import { utcWeekDates, utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import {
  customDraftLine,
  newCustomItemDraft,
  type CustomItemDraft,
} from "@/modules/orders/domain/custom-order-capture-draft";
import type {
  CanonicalDishLine,
  CanonicalOrderCommand,
} from "@/modules/orders/domain/canonical-order-write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomOrderItemEditor } from "./custom-order-item-editor";
import { CanonicalOrderSubmit } from "./canonical-order-submit";

/** Staff-only canonical actions; legacy editors/guards remain untouched. */
export function CanonicalOrderEditPanel({
  orderId,
  channel,
  onSuccess,
  onLockChange,
}: {
  orderId: string;
  channel: "individual" | "company";
  onSuccess?: () => void;
  onLockChange?: (locked: boolean) => void;
}) {
  const enabled = useCustomOrderCapture(channel);
  const { user, tenantId, roles } = useAuth();
  const [mode, setMode] = useState<"modify" | "repeat">();
  const [source, setSource] = useState<CustomCaptureSourceOrder>();
  const [week, setWeek] = useState("");
  const [custom, setCustom] = useState<CustomItemDraft[]>([]);
  const [dishes, setDishes] = useState<Array<CanonicalDishLine & { label: string; key: string }>>(
    [],
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [skipConfirmed, setSkipConfirmed] = useState(false);
  const generation = useRef(0);
  const open = async (nextMode: "modify" | "repeat") => {
    if (!enabled || !user || !tenantId || loading) return;
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      const record = await loadCustomCaptureSource(ctx, orderId);
      if (
        !record ||
        record.order.tenant_id !== tenantId ||
        record.order.demand_channel === "company"
      )
        throw new Error("Pedido individual no disponible.");
      if (nextMode === "modify" && record.order.write_contract_version !== 2)
        throw new Error("Este pedido pertenece al editor anterior.");
      const targetWeek = nextMode === "repeat" ? utcWeekStartMonday() : record.order.week_start;
      let customLines: CustomItemDraft[];
      let dishLines: typeof dishes;
      let unavailable = 0;
      if (nextMode === "repeat") {
        const plan = await previewCustomCaptureRepeat(ctx, orderId, targetWeek);
        customLines = plan.customProposals.map((proposal) => ({
          ...newCustomItemDraft(proposal.targetDayDate),
          name: proposal.name,
          description: proposal.description ?? "",
          qty: proposal.qty,
          repeatProposal: proposal,
        }));
        dishLines = plan.available.map((line, index) => ({
          kind: "dish",
          dishId: line.dishId,
          dayDate: line.targetDayDate,
          qty: line.qty,
          label: line.dishName ?? "Plato",
          key: `repeat-dish:${index}`,
        }));
        unavailable = plan.unavailable.length;
      } else {
        customLines = record.items.flatMap((item) => {
          const line = readOrderItem(item);
          return line.kind === "custom"
            ? [
                {
                  key: line.identity,
                  lineId: item.id,
                  name: line.name!,
                  description: line.description ?? "",
                  qty: item.qty,
                  dayDate: item.day_date,
                  price: String(item.unit_price ?? ""),
                  explicitZeroConfirmed: item.price_snapshot_status === "explicit_zero",
                  comment: item.comment,
                },
              ]
            : [];
        });
        dishLines = record.items.flatMap((item) => {
          const line = readOrderItem(item);
          return line.kind === "dish"
            ? [
                {
                  kind: "dish" as const,
                  lineId: item.id,
                  dishId: line.dishId,
                  dayDate: item.day_date,
                  qty: item.qty,
                  comment: item.comment,
                  label: line.name ?? "Plato",
                  key: item.id,
                },
              ]
            : [];
        });
      }
      if (current !== generation.current) return;
      setSource(record.order);
      setWeek(targetWeek);
      setCustom(customLines);
      setDishes(dishLines);
      setNotes(nextMode === "repeat" ? `repeat:${orderId}` : (record.order.notes ?? ""));
      setSkipped(unavailable);
      setSkipConfirmed(false);
      setMode(nextMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el pedido.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  };
  if (!enabled) return null;
  const days = week ? utcWeekDates(week) : [];
  const buildCommand = (autoConfirm: boolean): CanonicalOrderCommand => {
    if (!source || !enabled || (skipped > 0 && !skipConfirmed))
      throw new Error("Confirma las líneas no disponibles.");
    const lines = [
      ...dishes.map(({ key: _key, label: _label, ...line }) => line),
      ...custom.map(customDraftLine),
    ];
    return mode === "modify"
      ? {
          operation: "modify",
          orderId: source.id,
          expectedRevision: source.revision!,
          weekStart: week,
          lines,
          orderNotes: notes,
          demandChannel: "individual",
        }
      : {
          operation: "capture",
          customer: { kind: "existing", id: source.customer_id },
          autoConfirm,
          weekStart: week,
          lines,
          orderNotes: notes,
          demandChannel: "individual",
        };
  };
  return (
    <section
      aria-label="Edición y repetición canónicas"
      className="min-w-0 space-y-3 rounded border p-3"
    >
      {!mode && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={loading} onClick={() => void open("modify")}>
            Editar artículos
          </Button>
          <Button variant="outline" disabled={loading} onClick={() => void open("repeat")}>
            Repetir con reconfirmación
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {mode && source && tenantId && (
        <>
          <h3 className="font-semibold">
            {mode === "modify" ? "Editar / archivar líneas" : "Reconfirmar pedido"} · Semana {week}
          </h3>
          <fieldset disabled={locked} className="min-w-0 space-y-3">
            {dishes.map((line) => (
              <div key={line.key} className="space-y-2 rounded border p-2">
                <p className="break-words">Plato: {line.label}</p>
                <label>
                  Cantidad
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={Number.isNaN(line.qty) ? "" : line.qty}
                    onChange={(e) =>
                      setDishes((items) =>
                        items.map((item) =>
                          item.key === line.key ? { ...item, qty: e.target.valueAsNumber } : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Fecha entrega
                  <select
                    className="w-full h-10 border rounded bg-background"
                    value={line.dayDate}
                    onChange={(e) =>
                      setDishes((items) =>
                        items.map((item) =>
                          item.key === line.key ? { ...item, dayDate: e.target.value } : item,
                        ),
                      )
                    }
                  >
                    {days.map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="outline"
                  onClick={() =>
                    setDishes((items) => items.filter((item) => item.key !== line.key))
                  }
                >
                  Retirar plato {line.label}
                </Button>
              </div>
            ))}
            {custom.map((draft) => (
              <CustomOrderItemEditor
                key={draft.key}
                draft={draft}
                weekDays={days}
                onChange={(next) =>
                  setCustom((items) => items.map((item) => (item.key === next.key ? next : item)))
                }
                onRemove={() =>
                  setCustom((items) => items.filter((item) => item.key !== draft.key))
                }
              />
            ))}
            <Button
              variant="outline"
              onClick={() => setCustom((items) => [...items, newCustomItemDraft(week)])}
            >
              + Añadir personalizado
            </Button>
            <label>
              Notas
              <Input value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
            </label>
            {skipped > 0 && (
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={skipConfirmed}
                  onChange={(e) => setSkipConfirmed(e.target.checked)}
                />
                Confirmo excluir {skipped} líneas de platos no disponibles esta semana.
              </label>
            )}
            <p className="text-xs">
              Retirar una línea persistida la archiva en el commit. El pedido debe conservar al
              menos un artículo.
            </p>
          </fieldset>
          <CanonicalOrderSubmit
            tenantId={tenantId}
            enabled={enabled}
            buildCommand={buildCommand}
            dishLabel={(id) =>
              dishes.find((dish) => dish.dishId === id)?.label ?? `Plato ${id.slice(0, 8)}`
            }
            onLock={(next) => {
              setLocked(next);
              onLockChange?.(next);
            }}
            onSuccess={() => {
              setMode(undefined);
              setLocked(false);
              onLockChange?.(false);
              onSuccess?.();
            }}
          />
          <Button variant="ghost" disabled={locked} onClick={() => setMode(undefined)}>
            Cerrar editor
          </Button>
        </>
      )}
    </section>
  );
}
