/**
 * CX005 — Zero Friction Customer Growth · Living Profile panel.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CustomerContext, PartyRef } from "@/customer/CustomerContext";
import {
  GROWTH_SECTIONS,
  getLivingProfile,
  livingProfileCompleteness,
  saveLivingProfileSection,
  type GrowthSectionId,
  type LivingProfileGrowth,
} from "@/customer-experience/living-profile";
import { cn } from "@/lib/utils";

function partyRefOf(ctx: CustomerContext): PartyRef {
  return { kind: ctx.summary.partyKind, id: ctx.summary.id };
}

export function ProfileGrowthPanel(props: {
  context: CustomerContext;
  canWrite: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
}) {
  const ref = partyRefOf(props.context);
  const [growth, setGrowth] = useState<LivingProfileGrowth | null>(() =>
    getLivingProfile(ref),
  );
  const [editing, setEditing] = useState<GrowthSectionId | null>(null);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setGrowth(getLivingProfile(ref));
    setEditing(null);
    setDirty(false);
  }, [props.context.summary.id, props.context.summary.partyKind]);

  const completeness = livingProfileCompleteness(growth);

  function startEdit(id: GrowthSectionId) {
    if (dirty && editing && editing !== id) {
      if (!window.confirm("Hay cambios sin guardar. ¿Descartar?")) return;
    }
    const section = GROWTH_SECTIONS.find((s) => s.id === id);
    if (!section) return;
    const current = growth?.[section.field];
    setDraft(typeof current === "string" ? current : "");
    setEditing(id);
    setDirty(false);
  }

  function cancelEdit() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Descartar?")) {
      return;
    }
    setEditing(null);
    setDirty(false);
  }

  function saveEdit() {
    if (!props.canWrite || !editing) return;
    const section = GROWTH_SECTIONS.find((s) => s.id === editing);
    if (!section) return;
    props.onBusy(true);
    const started = performance.now();
    try {
      const next = saveLivingProfileSection(
        ref,
        section.field,
        draft.trim() || null,
      );
      setGrowth(next);
      const ms = Math.round(performance.now() - started);
      toast.success(
        draft.trim()
          ? `Perfil enriquecido · ${ms} ms (objetivo < 30s)`
          : `Sección liberada · listo para seguir`,
      );
      setEditing(null);
      setDirty(false);
    } finally {
      props.onBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Living Customer Profile · CX005
          </p>
          <p className="mt-1 text-sm font-semibold">
            El perfil crece con la relación
          </p>
          <p className="text-xs text-muted-foreground">
            Nunca antes. Nunca obligatorio. Nunca bloquea el trabajo.
          </p>
        </div>
        <CompletenessMeter percent={completeness.percent} />
      </div>

      <p className="text-xs text-muted-foreground">
        {completeness.filled === 0
          ? "Todavía vacío — perfecto para el día 1"
          : completeness.percent === 100
            ? "Perfil enriquecido · ¡bien!"
            : `${completeness.filled} de ${completeness.total} secciones · sigue cuando aporte valor`}
      </p>

      <ul className="space-y-2">
        {GROWTH_SECTIONS.map((section) => {
          const value = growth?.[section.field];
          const filled = typeof value === "string" && value.trim().length > 0;
          const isEditing = editing === section.id;
          return (
            <li
              key={section.id}
              className={cn(
                "rounded-md border px-3 py-2 space-y-2",
                isEditing
                  ? "border-foreground/30 bg-foreground/[0.03]"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">
                    {section.title}
                    {filled ? (
                      <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                        · listo
                      </span>
                    ) : (
                      <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                        · cuando haga falta
                      </span>
                    )}
                  </p>
                  {!isEditing ? (
                    <p className="text-[11px] text-muted-foreground">
                      {filled ? value : section.hint}
                    </p>
                  ) : null}
                </div>
                {isEditing ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={props.busy}
                      onClick={saveEdit}
                      className="min-h-9 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="min-h-9 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!props.canWrite || props.busy}
                    onClick={() => startEdit(section.id)}
                    className="min-h-9 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
                  >
                    {filled ? "Actualizar" : "Añadir"}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                  }}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base sm:text-sm"
                  placeholder={section.hint}
                />
              ) : null}
            </li>
          );
        })}
        <li className="rounded-md border border-dashed border-border/80 px-3 py-2">
          <p className="text-xs font-semibold">Adjuntos</p>
          <p className="text-[11px] text-muted-foreground">
            Pronto · nunca bloquea
          </p>
        </li>
      </ul>
    </div>
  );
}

function CompletenessMeter(props: { percent: number }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5"
      aria-label={`Perfil ${props.percent}% enriquecido`}
    >
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground/20"
        style={{
          background: `conic-gradient(currentColor ${props.percent}%, transparent 0)`,
          color: "hsl(var(--foreground) / 0.35)",
        }}
      >
        <span className="absolute inset-1 flex items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground">
          {props.percent}%
        </span>
      </div>
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        crecimiento
      </span>
    </div>
  );
}
