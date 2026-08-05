/**
 * Minimal Incidents panel for Developer Platform Host.
 * DEVELOPER-PLATFORM-005 — no advanced UI yet.
 */

import { useMemo, useState } from "react";
import {
  dismissIncident,
  exportIncidents,
  getIncidentTimeline,
  getOpenIncidents,
  getResolvedIncidents,
  recoverIncident,
} from "./IncidentEngine";
import { INCIDENT_ENGINE_VERSION } from "./incident.types";
import { incidentCategoryLabel } from "./IncidentCategories";

export function IncidentsPanel() {
  const [tick, setTick] = useState(0);
  const open = useMemo(() => {
    void tick;
    return getOpenIncidents();
  }, [tick]);
  const resolved = useMemo(() => {
    void tick;
    return getResolvedIncidents();
  }, [tick]);
  const timeline = useMemo(() => {
    void tick;
    return getIncidentTimeline({ limit: 40 });
  }, [tick]);

  const [copied, setCopied] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);

  async function copyJson() {
    const payload = {
      engine: "incident-engine",
      version: INCIDENT_ENGINE_VERSION,
      exportedAt: new Date().toISOString(),
      incidents: exportIncidents(),
      timeline: getIncidentTimeline(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    setTick((n) => n + 1);
  }

  return (
    <div className="space-y-3 p-1 text-[11px] text-zinc-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Incidents
          </p>
          <p className="text-[9px] text-zinc-500">
            Incident Engine v{INCIDENT_ENGINE_VERSION} · structured · FOPEBA
          </p>
        </div>
        <button
          type="button"
          className="rounded border border-white/20 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/10"
          onClick={() => setTick((n) => n + 1)}
        >
          Refresh
        </button>
      </div>

      <section>
        <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Open ({open.length})
        </h3>
        {open.length === 0 ? (
          <p className="text-zinc-500">No open incidents.</p>
        ) : (
          <ul className="space-y-2">
            {open.map((inc) => (
              <li
                key={inc.id}
                className="rounded border border-white/10 bg-white/5 px-2 py-1.5"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-zinc-100">{inc.title}</span>
                  <span className="font-mono text-[9px] uppercase text-rose-300">
                    {inc.severity}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">{inc.description}</p>
                <p className="mt-0.5 font-mono text-[9px] text-zinc-500">
                  {incidentCategoryLabel(inc.category)} · {inc.capability} · conf{" "}
                  {Math.round(inc.confidence * 100)}%
                </p>
                {inc.recommendation ? (
                  <p className="mt-1 text-[10px] text-sky-200/90">
                    → {inc.recommendation}
                  </p>
                ) : null}
                <p className="mt-0.5 font-mono text-[9px] text-zinc-600">
                  evidence: {inc.evidenceIds.join(", ") || "—"}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-white/10"
                    onClick={() => {
                      dismissIncident(inc.id);
                      setTick((n) => n + 1);
                    }}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-white/10"
                    onClick={() => {
                      const r = recoverIncident(inc.id);
                      setRecoveryMsg(`${r.code}: ${r.message}`);
                      setTick((n) => n + 1);
                    }}
                  >
                    Recover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Resolved / dismissed ({resolved.length})
        </h3>
        {resolved.length === 0 ? (
          <p className="text-zinc-500">None yet.</p>
        ) : (
          <ul className="space-y-1">
            {resolved.slice(0, 12).map((inc) => (
              <li key={inc.id} className="flex justify-between gap-2 text-zinc-500">
                <span className="truncate">{inc.title}</span>
                <span className="shrink-0 font-mono text-[9px]">{inc.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Timeline
        </h3>
        {timeline.length === 0 ? (
          <p className="text-zinc-500">No timeline events.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {[...timeline].reverse().map((ev) => (
              <li key={ev.id} className="border-l border-amber-500/40 pl-2">
                <div className="font-mono text-[9px] text-zinc-500">
                  {new Date(ev.timestamp).toLocaleTimeString()} · {ev.kind}
                </div>
                <div className="text-[10px] text-zinc-300">{ev.message}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recoveryMsg ? (
        <p className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100">
          {recoveryMsg}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void copyJson()}
        className="w-full rounded-lg border border-amber-400/50 bg-amber-500/10 py-2 text-center text-[11px] font-bold text-amber-100 hover:bg-amber-500/20"
      >
        {copied ? "Copied ✓" : "Copy JSON"}
      </button>
    </div>
  );
}
