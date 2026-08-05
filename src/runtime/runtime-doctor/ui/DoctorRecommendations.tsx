/**
 * Doctor Recommendations — renders Recommendation Engine output (not hardcoded).
 * DEVELOPER-PLATFORM-008
 */

import type { RuntimeRecommendation } from "../../recommendation-engine";

function priorityClass(p: string): string {
  switch (p) {
    case "critical":
      return "text-rose-400";
    case "high":
      return "text-orange-300";
    case "medium":
      return "text-amber-300";
    default:
      return "text-zinc-400";
  }
}

export function DoctorRecommendations({
  items,
  onCopy,
  onOpenKnowledge,
  onViewIncident,
}: {
  items: RuntimeRecommendation[];
  onCopy?: (item: RuntimeRecommendation) => void;
  onOpenKnowledge?: (item: RuntimeRecommendation) => void;
  onViewIncident?: (item: RuntimeRecommendation) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Recommendations · {items.length}
      </h3>
      {items.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">
          No recommendations from Knowledge.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] text-zinc-100">{r.title}</p>
                <span
                  className={`shrink-0 font-mono text-[9px] uppercase ${priorityClass(r.priority)}`}
                >
                  {r.priority}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">
                {r.description}
              </p>
              <p className="mt-1 font-mono text-[9px] text-zinc-600">
                conf {Math.round(r.confidence * 100)}% · knowledge{" "}
                {r.knowledgeIds[0]} · {r.incidentIds.length} incident
                {r.incidentIds.length === 1 ? "" : "s"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <MiniBtn
                  label="Copy"
                  onClick={() => onCopy?.(r)}
                />
                <MiniBtn
                  label="Open Knowledge"
                  onClick={() => onOpenKnowledge?.(r)}
                />
                <MiniBtn
                  label="View Incident"
                  onClick={() => onViewIncident?.(r)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MiniBtn({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400 hover:bg-white/5"
    >
      {label}
    </button>
  );
}
