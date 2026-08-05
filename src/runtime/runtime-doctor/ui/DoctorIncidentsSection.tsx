/**
 * Open incidents strip — reads Incident Engine (no Engine mutation beyond dismiss).
 */

import type { RuntimeIncident } from "../../incident-engine";
import { statusDotClass, statusTextClass } from "./doctor-ui-helpers";

export function DoctorIncidentsSection({
  incidents,
  selectedId,
  onSelect,
  onDismiss,
}: {
  incidents: RuntimeIncident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Incidents · {incidents.length} open
      </h3>
      {incidents.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">No open incidents.</p>
      ) : (
        <ul className="space-y-1.5">
          {incidents.map((inc) => {
            const selected = selectedId === inc.id;
            return (
              <li key={inc.id}>
                <button
                  type="button"
                  onClick={() => onSelect(selected ? null : inc.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDotClass(inc.severity)}`}
                      />
                      <span className="text-[12px] text-zinc-100">
                        {inc.title}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase ${statusTextClass(inc.severity)}`}
                    >
                      {inc.severity}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-zinc-600">
                    <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    <span>{inc.moduleId}</span>
                    <span>{inc.capability}</span>
                  </div>
                </button>
                {selected ? (
                  <div className="mt-1 space-y-1.5 rounded-md border border-white/[0.06] bg-black/25 px-3 py-2">
                    <p className="text-[11px] text-zinc-300">{inc.description}</p>
                    {inc.recommendation ? (
                      <p className="text-[10px] text-sky-200/90">
                        → {inc.recommendation}
                      </p>
                    ) : null}
                    <p className="font-mono text-[9px] text-zinc-600">
                      evidence: {inc.evidenceIds.join(", ") || "—"} · conf{" "}
                      {Math.round(inc.confidence * 100)}%
                    </p>
                    <button
                      type="button"
                      className="rounded border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400 hover:bg-white/5"
                      onClick={() => onDismiss(inc.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
