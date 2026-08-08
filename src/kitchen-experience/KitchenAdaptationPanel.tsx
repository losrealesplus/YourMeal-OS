/**
 * KE003 — Zero Friction Kitchen Execution Adaptation (Experience only).
 *
 * Adapt execution when kitchen reality changes.
 * Never re-plan Production. Session overlays only. Escalate when local is not enough.
 * Start / Pause / Resume / Block / Assign / Notify → Future (Capability).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  adaptationKindLabel,
  buildAdaptedTodaysKitchenWork,
  confirmExecutionAdaptation,
  effectiveExecutionQuantity,
  previewExecutionAdaptation,
  type AdaptationDraft,
  type AdaptationImpact,
  type ExecutionAdaptationKind,
} from "@/kitchen-experience/adapt-execution";
import {
  downloadKitchenWorkCsv,
  printKitchenWork,
} from "@/kitchen-experience/export-kitchen-work";
import {
  kitchenWorkStatusLabel,
  listHandedOffPlans,
  type KitchenExecutionCard,
  type KitchenWorkStatus,
} from "@/kitchen-experience/today-work";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  dayDate?: string | null;
  focusWorkId?: string | null;
  onBackToToday: () => void;
};

const KINDS: { id: ExecutionAdaptationKind; label: string }[] = [
  { id: "quantity", label: "Cantidad" },
  { id: "sequence", label: "Secuencia" },
  { id: "prep_availability", label: "Prep" },
  { id: "note", label: "Nota" },
  { id: "special_instruction", label: "Instrucción" },
  { id: "temporary_issue", label: "Incidencia" },
  { id: "priority", label: "Prioridad" },
];

function statusTone(
  s: KitchenWorkStatus,
): "positive" | "warning" | "info" | "neutral" {
  if (s === "completed") return "positive";
  if (s === "blocked") return "warning";
  if (s === "in_progress") return "info";
  return "neutral";
}

export function KitchenAdaptationPanel({
  canWrite,
  dayDate: focusDay,
  focusWorkId = null,
  onBackToToday,
}: Props) {
  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [selectedId, setSelectedId] = useState<string | null>(focusWorkId);
  const [kind, setKind] = useState<ExecutionAdaptationKind>("quantity");
  const [pendingImpact, setPendingImpact] = useState<AdaptationImpact | null>(
    null,
  );
  const [qty, setQty] = useState("");
  const [sequenceRank, setSequenceRank] = useState("1");
  const [prepAvailable, setPrepAvailable] = useState(true);
  const [prepNote, setPrepNote] = useState("");
  const [note, setNote] = useState("");
  const [instruction, setInstruction] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("high");
  const [requestProductionChange, setRequestProductionChange] = useState(false);

  const handedOff = useMemo(() => {
    void tick;
    return listHandedOffPlans();
  }, [tick]);

  const view = useMemo(() => {
    void tick;
    return buildAdaptedTodaysKitchenWork(dayDate);
  }, [dayDate, tick]);

  const selected: KitchenExecutionCard | null =
    view.cards.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (focusWorkId) setSelectedId(focusWorkId);
  }, [focusWorkId]);

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function clearDraft() {
    setPendingImpact(null);
    setRequestProductionChange(false);
  }

  function buildDraft(): AdaptationDraft | null {
    if (!selected) return null;
    const base: AdaptationDraft = {
      kind,
      workId: selected.id,
      requestProductionChange,
    };
    switch (kind) {
      case "quantity": {
        const n = Number(qty);
        if (!Number.isFinite(n) || n < 0) return null;
        return { ...base, executionQuantity: n };
      }
      case "sequence": {
        const n = Number(sequenceRank);
        if (!Number.isFinite(n)) return null;
        return { ...base, sequenceRank: n };
      }
      case "prep_availability":
        return {
          ...base,
          prepAvailable,
          prepAvailabilityNote: prepNote,
        };
      case "note":
        return { ...base, executionNote: note };
      case "special_instruction":
        return { ...base, specialInstruction: instruction };
      case "temporary_issue":
        return { ...base, temporaryIssue: issue };
      case "priority":
        return { ...base, priority };
    }
  }

  function reviewImpact() {
    if (!selected) {
      toast.message("Selecciona un trabajo");
      return;
    }
    const draft = buildDraft();
    if (!draft) {
      toast.message("Completa el ajuste");
      return;
    }
    const impact = previewExecutionAdaptation(selected, draft);
    if (!impact) {
      toast.message("Sin cambio");
      return;
    }
    setPendingImpact(impact);
  }

  function confirm() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    if (!selected || !pendingImpact) return;
    const draft = buildDraft();
    if (!draft) return;
    const impact = confirmExecutionAdaptation(selected, draft);
    if (!impact) {
      toast.error("No se pudo adaptar");
      return;
    }
    refresh();
    clearDraft();
    if (impact.escalationRequired && !impact.affectsExecutionItem) {
      toast.message(impact.summary);
    } else {
      toast.success(`${impact.summary} · sesión`);
    }
  }

  if (handedOff.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="ke-adapt-empty">
        <h2 id="ke-adapt-empty" className="text-sm font-semibold tracking-wide">
          Adaptación de ejecución
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay trabajo transferido para adaptar.
          </p>
          <p className="text-xs text-muted-foreground">
            Kitchen adapta ejecución local — no replanifica Production. Primero
            debe existir handoff Ready for Kitchen.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a Today's Work
            </button>
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Revisar Production Handoff
            </Link>
            <Link
              to="/admin/production-planning"
              search={{ mode: "planning", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Production
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (view.emptyReason) {
    return (
      <section className="space-y-4" aria-labelledby="ke-adapt-day-empty">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="ke-adapt-day-empty"
              className="text-sm font-semibold tracking-wide"
            >
              Adaptación de ejecución
            </h2>
            <p className="text-xs text-muted-foreground">
              Sin trabajo este día — elige otro o vuelve a Today's Work
            </p>
          </div>
          <label className="text-xs">
            <span className="sr-only">Día</span>
            <input
              type="date"
              className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={dayDate}
              onChange={(e) => {
                setDayDate(e.target.value);
                clearDraft();
                setSelectedId(null);
              }}
            />
          </label>
        </div>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">{view.emptyReason}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Volver a Today's Work
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="ke-adapt">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ke-adapt" className="text-sm font-semibold tracking-wide">
            Adaptación de ejecución
          </h2>
          <p className="text-xs text-muted-foreground">
            Reacciona a la realidad de cocina sin replanificar Production
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Día</span>
          <input
            type="date"
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={dayDate}
            onChange={(e) => {
              setDayDate(e.target.value);
              clearDraft();
              setSelectedId(null);
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="warning" label="TTAE < 30 s" />
        <StatusChip tone="info" label="Resume < 5 s" />
        <StatusChip tone="info" label="Sesión · no Capability" />
        <StatusChip
          tone="positive"
          label={`${view.cards.length} trabajos · ${view.dayLabel}`}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Production determina el trabajo · Handoff lo transfiere · Kitchen adapta
        solo la ejecución local. El plan de Production no se modifica aquí.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBackToToday}
          className="text-xs underline-offset-2 hover:underline"
        >
          Volver a Today's Work
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printKitchenWork(view)}
        >
          Imprimir
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadKitchenWorkCsv(view);
            toast.success("CSV de cocina descargado");
          }}
        >
          Exportar
        </button>
        <span className="text-xs text-muted-foreground">
          Block / Assign / Notify → Future
        </span>
      </div>

      <ul className="space-y-2">
        {view.cards.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedId(c.id);
                clearDraft();
                setQty(String(effectiveExecutionQuantity(c)));
                setPriority(c.priority);
              }}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left",
                selectedId === c.id
                  ? "border-foreground bg-muted/40"
                  : "border-border/60",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {c.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {effectiveExecutionQuantity(c)} uds · {c.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline {c.cookingDeadline} · Production {c.quantity}
                    {c.executionAdapted ? " · adaptado (sesión)" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={statusTone(c.status)}
                    label={kitchenWorkStatusLabel(c.status)}
                  />
                  {c.urgent ? (
                    <StatusChip tone="warning" label="Urgente" />
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div className="space-y-4 rounded-md border border-border/60 px-3 py-3">
          <div>
            <h3 className="text-xs font-semibold tracking-wide">
              Contexto de ejecución
            </h3>
            <p className="text-sm font-medium">{selected.dishLabel}</p>
            <p className="text-xs text-muted-foreground">
              Ejecutar {effectiveExecutionQuantity(selected)} · Production{" "}
              {selected.quantity}
              {selected.quantityEstimated ? "*" : ""} · batch {selected.batchKey}{" "}
              · deadline {selected.cookingDeadline} ·{" "}
              {kitchenWorkStatusLabel(selected.status)} · prep{" "}
              {selected.prepStatusSummary}
            </p>
            {view.warnings.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Avisos del día: {view.warnings.length}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setKind(k.id);
                  clearDraft();
                }}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  kind === k.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">
              Adaptar · {adaptationKindLabel(kind)}
            </p>
            {kind === "quantity" ? (
              <label className="block text-xs">
                Cantidad de ejecución (local)
                <input
                  type="number"
                  min={0}
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    clearDraft();
                  }}
                />
              </label>
            ) : null}
            {kind === "sequence" ? (
              <label className="block text-xs">
                Rank en cola (menor = antes)
                <input
                  type="number"
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={sequenceRank}
                  onChange={(e) => {
                    setSequenceRank(e.target.value);
                    clearDraft();
                  }}
                />
              </label>
            ) : null}
            {kind === "prep_availability" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={prepAvailable}
                    onChange={(e) => {
                      setPrepAvailable(e.target.checked);
                      clearDraft();
                    }}
                  />
                  Prep disponible para ejecutar
                </label>
                <label className="block text-xs">
                  Nota prep
                  <input
                    type="text"
                    className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={prepNote}
                    onChange={(e) => {
                      setPrepNote(e.target.value);
                      clearDraft();
                    }}
                  />
                </label>
              </div>
            ) : null}
            {kind === "note" ? (
              <label className="block text-xs">
                Nota de ejecución
                <input
                  type="text"
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    clearDraft();
                  }}
                />
              </label>
            ) : null}
            {kind === "special_instruction" ? (
              <label className="block text-xs">
                Instrucción especial de ejecución
                <input
                  type="text"
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={instruction}
                  onChange={(e) => {
                    setInstruction(e.target.value);
                    clearDraft();
                  }}
                  placeholder="Solo si aplica en cocina — no inventar pedido"
                />
              </label>
            ) : null}
            {kind === "temporary_issue" ? (
              <label className="block text-xs">
                Incidencia temporal
                <input
                  type="text"
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={issue}
                  onChange={(e) => {
                    setIssue(e.target.value);
                    clearDraft();
                  }}
                />
              </label>
            ) : null}
            {kind === "priority" ? (
              <label className="block text-xs">
                Prioridad de ejecución (local)
                <select
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as "high" | "normal" | "low");
                    clearDraft();
                  }}
                >
                  <option value="high">high</option>
                  <option value="normal">normal</option>
                  <option value="low">low</option>
                </select>
              </label>
            ) : null}

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={requestProductionChange}
                onChange={(e) => {
                  setRequestProductionChange(e.target.checked);
                  clearDraft();
                }}
              />
              Este cambio requiere modificar Production (escalar — no aplicar aquí)
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canWrite}
              onClick={reviewImpact}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Revisar impacto
            </button>
            <button
              type="button"
              disabled={!canWrite || !pendingImpact}
              onClick={confirm}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Cancelar
            </button>
          </div>

          {pendingImpact ? (
            <div className="space-y-2 rounded-md border border-dashed border-border px-3 py-3">
              <h4 className="text-xs font-semibold tracking-wide">
                Impacto antes de confirmar
              </h4>
              <p className="text-sm font-medium">{pendingImpact.summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium">Qué cambia</p>
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    {pendingImpact.changed.length === 0 ? (
                      <li>Nada en Kitchen (solo escalado)</li>
                    ) : (
                      pendingImpact.changed.map((c) => <li key={c}>{c}</li>)
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium">Qué no cambia</p>
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    {pendingImpact.unchanged.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs">
                Afecta ítem de ejecución:{" "}
                {pendingImpact.affectsExecutionItem ? "sí" : "no"}
              </p>
              <p className="text-xs">
                Plan de Production modificado:{" "}
                <span className="font-medium">no</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Persistencia: {pendingImpact.persistence} (no ExecutionUnit
                durable)
              </p>
              {pendingImpact.escalationRequired ? (
                <div className="rounded-md border border-border/60 px-2 py-2">
                  <p className="text-xs font-medium">Escalado necesario</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingImpact.escalationReason}
                  </p>
                  <p className="text-xs">
                    Siguiente: {pendingImpact.escalationNextAction}
                  </p>
                  {pendingImpact.escalationTarget === "production" ? (
                    <Link
                      to="/admin/production-planning"
                      search={{ mode: "handoff", weekStart: undefined }}
                      className="text-xs underline-offset-2 hover:underline"
                    >
                      Abrir Production Handoff
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {pendingImpact.substrateGap ? (
                <p className="text-xs text-muted-foreground">
                  Substrate gap: {pendingImpact.substrateGap}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Selecciona un trabajo para adaptar la ejecución.
        </p>
      )}
    </section>
  );
}
