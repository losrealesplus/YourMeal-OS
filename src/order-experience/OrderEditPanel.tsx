/**
 * OE003 — Zero Friction Order Edit (Experience only).
 * Inline corrections of a live commitment — not a CRUD form.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import type { OrderSearchHit } from "@/order-experience/OrderSearchPanel";
import {
  formatDayLabel,
  upcomingDeliveryDays,
  updateOperationalCommitment,
  type CommitmentItem,
} from "@/order-experience/operational-commitments";
import {
  applyEditToDisplay,
  facadeEditKey,
  getOrderEdit,
  saveOrderEdit,
} from "@/order-experience/operational-order-edits";
import {
  statusLabel,
  statusTone,
} from "@/order-experience/order-search-rank";
import {
  CONVERSATION_DISHES,
  customDishId,
  dishById,
} from "@/order-experience/conversation-catalog";
import { cn } from "@/lib/utils";

type Section = "day" | "items" | "notes" | "address" | null;

type Props = {
  hit: OrderSearchHit;
  canWrite: boolean;
  onClose: () => void;
  onSaved: (hit: OrderSearchHit) => void;
};

function blockedReason(hit: OrderSearchHit): string | null {
  if (hit.status === "cancelled") {
    return "Este pedido está cancelado — no se puede editar.";
  }
  if (hit.status === "delivered") {
    return "Pedido ya entregado — crea uno similar o abre el cliente.";
  }
  return null;
}

export function OrderEditPanel({ hit, canWrite, onClose, onSaved }: Props) {
  const blocked = blockedReason(hit);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState<Section>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const editKey =
    hit.source === "facade" ? facadeEditKey(hit.id) : `session:${hit.id}`;
  const existingEdit = getOrderEdit(editKey);

  const baseItems: CommitmentItem[] =
    hit.session?.items ??
    (hit.itemCount > 0
      ? [
          {
            dishId: "exp:unknown",
            label: `${hit.itemCount} ítem(s)`,
            qty: hit.itemCount,
          },
        ]
      : []);

  const base = applyEditToDisplay({
    deliveryDay: hit.deliveryDay,
    instructions: hit.session?.instructions ?? "",
    dietaryNotes: existingEdit?.dietaryNotes ?? "",
    addressNote: existingEdit?.addressNote ?? hit.area ?? "",
    items: existingEdit?.items ?? baseItems,
    edit: existingEdit,
  });

  const [day, setDay] = useState(base.deliveryDay ?? upcomingDeliveryDays(1)[0]!);
  const [items, setItems] = useState<CommitmentItem[]>(base.items);
  const [instructions, setInstructions] = useState(base.instructions);
  const [dietary, setDietary] = useState(base.dietaryNotes);
  const [addressNote, setAddressNote] = useState(base.addressNote);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    resumeRef.current?.focus();
  }, []);

  function persist(partial: {
    deliveryDay?: string;
    instructions?: string;
    dietaryNotes?: string;
    addressNote?: string;
    items?: CommitmentItem[];
  }) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura de pedidos");
      return;
    }
    if (blocked) {
      toast.error(blocked);
      return;
    }

    if (hit.source === "session") {
      const updated = updateOperationalCommitment(hit.id, {
        deliveryDay: partial.deliveryDay ?? day,
        instructions: partial.instructions ?? instructions,
        items: partial.items ?? items,
      });
      if (!updated) {
        toast.error("No se encontró el compromiso de sesión");
        return;
      }
      saveOrderEdit(`session:${hit.id}`, {
        dietaryNotes: partial.dietaryNotes ?? dietary,
        addressNote: partial.addressNote ?? addressNote,
        deliveryDay: updated.deliveryDay,
        instructions: updated.instructions,
        items: updated.items,
      });
      toast.success("Compromiso actualizado");
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
      const nextArea =
        (partial.addressNote ?? addressNote).trim() || hit.area;
      onSaved({
        ...hit,
        deliveryDay: updated.deliveryDay,
        itemCount: updated.items.reduce((n, i) => n + i.qty, 0),
        hasInstructions: Boolean(updated.instructions.trim()),
        area: nextArea,
        session: updated,
      });
      setEditing(null);
      window.setTimeout(() => resumeRef.current?.focus(), 0);
      return;
    }

    // Facade: no UpdateOrder — session overlay honesty
    const patch = saveOrderEdit(editKey, {
      deliveryDay: partial.deliveryDay ?? day,
      instructions: partial.instructions ?? instructions,
      dietaryNotes: partial.dietaryNotes ?? dietary,
      addressNote: partial.addressNote ?? addressNote,
      items: partial.items ?? items,
    });
    toast.success("Corrección guardada (sesión · UpdateOrder pendiente)");
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
    onSaved({
      ...hit,
      deliveryDay: patch.deliveryDay ?? hit.deliveryDay,
      itemCount: (patch.items ?? items).reduce((n, i) => n + i.qty, 0),
      hasInstructions: Boolean((patch.instructions ?? "").trim()),
      area: patch.addressNote || hit.area,
    });
    setEditing(null);
    window.setTimeout(() => resumeRef.current?.focus(), 0);
  }

  function bumpQty(dishId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((l) =>
          l.dishId === dishId ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function addDish(dishId: string, label: string) {
    setItems((prev) => {
      const ex = prev.find((l) => l.dishId === dishId);
      if (ex) {
        return prev.map((l) =>
          l.dishId === dishId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { dishId, label, qty: 1 }];
    });
  }

  const days = upcomingDeliveryDays(6);

  return (
    <section className="space-y-4" aria-labelledby="oe-edit">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="oe-edit" className="text-sm font-semibold tracking-wide">
            Corregir compromiso
          </h2>
          <p className="text-lg font-medium">{hit.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {hit.organizationLabel ? `${hit.organizationLabel} · ` : ""}
            {formatDayLabel(day)}
            {addressNote ? ` · ${addressNote}` : hit.area ? ` · ${hit.area}` : ""}
          </p>
        </div>
        <StatusChip tone={statusTone(hit.status)} label={statusLabel(hit.status)} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          {hit.source === "session"
            ? "Sesión · editable"
            : "Facade · corrección Experience (UpdateOrder pendiente)"}
        </span>
        {savedFlash ? <StatusChip tone="positive" label="Guardado" /> : null}
      </div>

      {blocked ? (
        <div className="space-y-2 rounded-md border border-border px-3 py-3 text-sm">
          <p>{blocked}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md bg-foreground px-4 text-sm text-background"
            >
              Volver a búsqueda
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
        <>
          {/* Day */}
          <EditBlock
            title="Día de entrega"
            open={editing === "day"}
            onToggle={() => setEditing(editing === "day" ? null : "day")}
            summary={formatDayLabel(day)}
          >
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-sm",
                    d === day
                      ? "border-foreground bg-foreground text-background"
                      : "border-border",
                  )}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
            </div>
            <SaveRow
              disabled={!canWrite}
              onSave={() => persist({ deliveryDay: day })}
              onCancel={() => setEditing(null)}
            />
          </EditBlock>

          {/* Items */}
          <EditBlock
            title="Platos y cantidades"
            open={editing === "items"}
            onToggle={() => setEditing(editing === "items" ? null : "items")}
            summary={
              items.length
                ? items.map((i) => `${i.qty}× ${i.label}`).join(" · ")
                : "Sin platos"
            }
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {CONVERSATION_DISHES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => addDish(d.id, d.label)}
                  className="min-h-10 rounded-md border border-border px-3 text-xs"
                >
                  + {d.short}
                </button>
              ))}
            </div>
            <div className="mb-2 flex gap-2">
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const label = customLabel.trim();
                    if (!label) return;
                    addDish(customDishId(label), label);
                    setCustomLabel("");
                  }
                }}
                placeholder="Sustitución / otro plato"
                className="min-h-11 flex-1 rounded-md border border-border px-3 text-base"
              />
            </div>
            <ul className="space-y-2 mb-2">
              {items.map((l) => (
                <li
                  key={l.dishId}
                  className="flex min-h-11 items-center justify-between gap-2"
                >
                  <span className="font-medium">
                    {l.label || dishById(l.dishId)?.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="min-h-11 min-w-11 border"
                      onClick={() => bumpQty(l.dishId, -1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center tabular-nums">{l.qty}</span>
                    <button
                      type="button"
                      className="min-h-11 min-w-11 border"
                      onClick={() => bumpQty(l.dishId, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <SaveRow
              disabled={!canWrite || items.length === 0}
              onSave={() => persist({ items })}
              onCancel={() => setEditing(null)}
            />
          </EditBlock>

          {/* Notes */}
          <EditBlock
            title="Instrucciones y dieta"
            open={editing === "notes"}
            onToggle={() => setEditing(editing === "notes" ? null : "notes")}
            summary={
              [instructions, dietary].filter(Boolean).join(" · ") || "Sin notas"
            }
          >
            <label className="block text-xs text-muted-foreground mb-1">
              Instrucciones especiales
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="mb-2 w-full rounded-md border border-border px-3 py-2 text-base"
              placeholder="Sin cebolla · dejar en recepción…"
            />
            <label className="block text-xs text-muted-foreground mb-1">
              Notas dietéticas
            </label>
            <textarea
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              rows={2}
              className="mb-2 w-full rounded-md border border-border px-3 py-2 text-base"
              placeholder="Sin gluten · alergia frutos secos…"
            />
            <SaveRow
              disabled={!canWrite}
              onSave={() =>
                persist({ instructions, dietaryNotes: dietary })
              }
              onCancel={() => setEditing(null)}
            />
          </EditBlock>

          {/* Address note */}
          <EditBlock
            title="Dirección / zona (nota operativa)"
            open={editing === "address"}
            onToggle={() =>
              setEditing(editing === "address" ? null : "address")
            }
            summary={addressNote || "Sin nota de dirección"}
          >
            <input
              value={addressNote}
              onChange={(e) => setAddressNote(e.target.value)}
              className="mb-2 min-h-11 w-full rounded-md border border-border px-3 text-base"
              placeholder="Portal B · Adeje · …"
            />
            <SaveRow
              disabled={!canWrite}
              onSave={() => persist({ addressNote })}
              onCancel={() => setEditing(null)}
            />
          </EditBlock>
        </>
      )}

      {/* Resume / NBA */}
      <div className="space-y-2 border-t border-border/50 pt-4">
        <p className="text-sm font-medium">¿Qué quieres hacer ahora?</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            ref={resumeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Volver a búsqueda
          </button>
          <Link
            to="/admin/customer-workspace"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Abrir cliente
          </Link>
          <Link
            to="/admin/production-workspace"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Generar producción
          </Link>
          <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
            Similar · Incidencia → OE004 / OE005
          </span>
        </div>
      </div>
    </section>
  );
}

function EditBlock(props: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <button
        type="button"
        onClick={props.onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">{props.title}</span>
          {!props.open ? (
            <span className="text-xs text-muted-foreground">{props.summary}</span>
          ) : null}
        </span>
        <span className="text-xs font-medium underline-offset-2 hover:underline">
          {props.open ? "Cerrar" : "Editar"}
        </span>
      </button>
      {props.open ? <div className="mt-2 space-y-2">{props.children}</div> : null}
    </div>
  );
}

function SaveRow(props: {
  disabled?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={props.disabled}
        onClick={props.onSave}
        className="min-h-11 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={props.onCancel}
        className="min-h-11 rounded-md border border-border px-4 text-sm"
      >
        Cancelar
      </button>
    </div>
  );
}
