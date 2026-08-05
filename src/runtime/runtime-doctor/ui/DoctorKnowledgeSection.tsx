/**
 * Doctor → Knowledge glance (dependency: Doctor knows Knowledge; never reverse).
 */

import type { KnowledgeMatch } from "../../knowledge-engine";
import { knowledgeCategoryLabel } from "../../knowledge-engine";

export function DoctorKnowledgeSection({
  matches,
}: {
  matches: KnowledgeMatch[];
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Knowledge · {matches.length} article{matches.length === 1 ? "" : "s"}
      </h3>
      {matches.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">
          No knowledge matches for open incidents / failed checks.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {matches.map((m) => (
            <li
              key={m.article.id}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] text-zinc-100">{m.article.title}</p>
                <span className="shrink-0 font-mono text-[9px] text-zinc-500">
                  {Math.round(m.score * 100)}%
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">
                {m.article.description}
              </p>
              <p className="mt-1 font-mono text-[9px] text-zinc-600">
                {knowledgeCategoryLabel(m.article.category)} ·{" "}
                {m.article.capabilities.join(", ")}
              </p>
              {m.article.recommendations[0] ? (
                <p className="mt-1 text-[10px] text-sky-200/90">
                  → {m.article.recommendations[0]}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
