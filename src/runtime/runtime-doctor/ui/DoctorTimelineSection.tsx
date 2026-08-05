/**
 * Chronological timeline (Incident Engine events).
 */

import type { IncidentTimelineEvent } from "../../incident-engine";

export function DoctorTimelineSection({
  events,
}: {
  events: IncidentTimelineEvent[];
}) {
  const ordered = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Timeline
      </h3>
      {ordered.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">
          Timeline appears after Doctor runs.
        </p>
      ) : (
        <ol className="relative max-h-52 space-y-0 overflow-y-auto border-l border-white/10 pl-3">
          {ordered.map((ev) => (
            <li key={ev.id} className="relative py-1.5">
              <span
                className="absolute -left-[0.91rem] top-2.5 h-1.5 w-1.5 rounded-full bg-zinc-500"
                aria-hidden
              />
              <p className="font-mono text-[9px] text-zinc-600">
                {new Date(ev.timestamp).toLocaleTimeString()} · {ev.kind}
              </p>
              <p className="text-[11px] text-zinc-300">{ev.message}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
