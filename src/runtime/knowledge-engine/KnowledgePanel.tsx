/**
 * Knowledge panel — articles · search · related capabilities.
 * DEVELOPER-PLATFORM-007
 */

import { useMemo, useState } from "react";
import { knowledgeCategoryLabel } from "./KnowledgeCategory";
import { getAllKnowledge } from "./KnowledgeRegistry";
import { searchKnowledge } from "./KnowledgeIndex";
import { matchCapability } from "./KnowledgeMatcher";
import { KNOWLEDGE_ENGINE_VERSION } from "./knowledge.types";
import { registerFoundationKnowledge } from "./articles/foundation";

export function KnowledgePanel() {
  registerFoundationKnowledge();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [capFilter, setCapFilter] = useState("");

  const articles = useMemo(() => {
    const base = query.trim()
      ? searchKnowledge(query)
      : getAllKnowledge();
    if (!capFilter.trim()) return base;
    const ids = new Set(matchCapability(capFilter).map((a) => a.id));
    return base.filter((a) => ids.has(a.id));
  }, [query, capFilter]);

  const selected = articles.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-col gap-3 p-1 text-[11px] text-zinc-200">
      <header>
        <p className="text-[10px] font-semibold tracking-tight text-zinc-100">
          Knowledge
        </p>
        <p className="text-[9px] text-zinc-500">
          Diagnostic Knowledge Model · v{KNOWLEDGE_ENGINE_VERSION} · declarative
        </p>
      </header>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
            Search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Assets · Logo · Android · Runtime · Supabase"
            className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
            Capability
          </span>
          <input
            value={capFilter}
            onChange={(e) => setCapFilter(e.target.value)}
            placeholder="assets · runtime · android…"
            className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          />
        </label>
      </div>

      <section className="space-y-2">
        <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Articles · {articles.length}
        </h3>
        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {articles.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() =>
                  setSelectedId((cur) => (cur === a.id ? null : a.id))
                }
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  selectedId === a.id
                    ? "border-white/20 bg-white/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-zinc-100">{a.title}</span>
                  <span className="font-mono text-[9px] uppercase text-zinc-500">
                    {a.severity}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-zinc-600">
                  {knowledgeCategoryLabel(a.category)} ·{" "}
                  {a.capabilities.join(", ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <section className="space-y-2 rounded-md border border-white/[0.08] bg-black/25 px-3 py-2.5">
          <h3 className="text-[12px] font-semibold text-zinc-100">
            {selected.title}
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {selected.description}
          </p>
          <div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
              Related capabilities
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-300">
              {selected.capabilities.join(" · ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
              Tags
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
              {selected.tags.join(" · ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
              Recommendations (knowledge)
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-zinc-300">
              {selected.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <p className="font-mono text-[9px] text-zinc-600">
            Related incidents: match via Doctor / Incident → KnowledgeMatcher
            (patterns: {selected.incidentPatterns.slice(0, 3).join(", ")}
            {selected.incidentPatterns.length > 3 ? "…" : ""})
          </p>
        </section>
      ) : null}
    </div>
  );
}
