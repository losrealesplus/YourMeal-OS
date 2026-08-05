/**
 * Recommendations Host panel.
 * DEVELOPER-PLATFORM-008
 */

import { useMemo, useState } from "react";
import {
  buildRecommendations,
  exportRecommendations,
  getRecommendations,
} from "./RecommendationEngine";
import { RECOMMENDATION_ENGINE_VERSION } from "./recommendation.types";
import type { RuntimeRecommendation } from "./recommendation.types";

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

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

export function RecommendationsPanel() {
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [focus, setFocus] = useState<"knowledge" | "incident" | null>(null);

  const items = useMemo(() => {
    void tick;
    return getRecommendations();
  }, [tick]);

  const selected =
    items.find((r) => r.id === selectedId) ?? null;

  function rebuild() {
    buildRecommendations();
    setTick((n) => n + 1);
  }

  async function copyAll() {
    await writeClipboard(
      JSON.stringify(
        {
          engine: "recommendation-engine",
          version: RECOMMENDATION_ENGINE_VERSION,
          exportedAt: new Date().toISOString(),
          recommendations: exportRecommendations(),
        },
        null,
        2,
      ),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 p-1 text-[11px] text-zinc-200">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-tight text-zinc-100">
            Recommendations
          </p>
          <p className="text-[9px] text-zinc-500">
            Decision engine · v{RECOMMENDATION_ENGINE_VERSION} · via Knowledge
          </p>
        </div>
        <button
          type="button"
          onClick={rebuild}
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
        >
          Rebuild
        </button>
      </header>

      {items.length === 0 ? (
        <p className="text-[11px] text-zinc-600">
          No recommendations. Run Doctor to create incidents that match
          Knowledge.
        </p>
      ) : (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {items.map((r) => (
            <RecommendationRow
              key={r.id}
              item={r}
              selected={selectedId === r.id}
              onSelect={() =>
                setSelectedId((cur) => (cur === r.id ? null : r.id))
              }
            />
          ))}
        </ul>
      )}

      {selected ? (
        <Detail
          item={selected}
          focus={focus}
          onCopy={async () => {
            await writeClipboard(JSON.stringify(selected, null, 2));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
          onOpenKnowledge={() => setFocus("knowledge")}
          onViewIncident={() => setFocus("incident")}
        />
      ) : null}

      {focus === "knowledge" && selected ? (
        <p className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-[9px] text-zinc-400">
          Knowledge: {selected.knowledgeIds.join(", ")}
        </p>
      ) : null}
      {focus === "incident" && selected ? (
        <p className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-[9px] text-zinc-400">
          Incidents: {selected.incidentIds.join(", ")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void copyAll()}
        className="w-full rounded-md border border-white/10 py-2 text-[11px] font-medium text-zinc-300 hover:bg-white/5"
      >
        {copied ? "Copied ✓" : "Export JSON"}
      </button>
    </div>
  );
}

function RecommendationRow({
  item,
  selected,
  onSelect,
}: {
  item: RuntimeRecommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
          selected
            ? "border-white/20 bg-white/[0.06]"
            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-zinc-100">{item.title}</span>
          <span
            className={`font-mono text-[9px] uppercase ${priorityClass(item.priority)}`}
          >
            {item.priority}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[9px] text-zinc-600">
          conf {Math.round(item.confidence * 100)}% ·{" "}
          {item.incidentIds.length} incident
          {item.incidentIds.length === 1 ? "" : "s"} ·{" "}
          {item.knowledgeIds[0]}
        </p>
      </button>
    </li>
  );
}

function Detail({
  item,
  focus,
  onCopy,
  onOpenKnowledge,
  onViewIncident,
}: {
  item: RuntimeRecommendation;
  focus: "knowledge" | "incident" | null;
  onCopy: () => void;
  onOpenKnowledge: () => void;
  onViewIncident: () => void;
}) {
  void focus;
  return (
    <section className="space-y-2 rounded-md border border-white/[0.08] bg-black/25 px-3 py-2.5">
      <p className="text-[11px] leading-relaxed text-zinc-400">
        {item.description}
      </p>
      <p className="font-mono text-[9px] text-zinc-600">
        Knowledge: {item.knowledgeIds.join(", ")}
      </p>
      <p className="font-mono text-[9px] text-zinc-600">
        Incidents: {item.incidentIds.join(", ")}
      </p>
      <ul className="space-y-1">
        {item.actions.map((a) => (
          <li
            key={a.id}
            className={`text-[10px] ${
              a.type === "recovery" || a.supported
                ? "text-zinc-300"
                : "text-zinc-600 line-through"
            }`}
          >
            [{a.type}] {a.label}
            {a.type === "recovery"
              ? " · via Recovery Engine"
              : !a.supported
                ? " · not supported"
                : ""}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5">
        <ActionBtn label="Copy" onClick={onCopy} />
        <ActionBtn label="Open Knowledge" onClick={onOpenKnowledge} />
        <ActionBtn label="View Incident" onClick={onViewIncident} />
      </div>
    </section>
  );
}

function ActionBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
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
