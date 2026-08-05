/**
 * Evidence ledger — FOPEBA payloads from last Doctor report.
 */

import { useState } from "react";
import type { RuntimeEvidence } from "../../runtime-core";
import { statusTextClass, writeClipboard } from "./doctor-ui-helpers";

export function DoctorEvidenceSection({
  evidences,
}: {
  evidences: RuntimeEvidence[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyOne(ev: RuntimeEvidence) {
    await writeClipboard(JSON.stringify(ev, null, 2));
    setCopiedId(ev.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Evidence · {evidences.length}
      </h3>
      {evidences.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">
          No evidence emitted (all checks passed or not run).
        </p>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto">
          {evidences.map((ev, i) => {
            const payload = ev.payload as {
              checkName?: string;
              status?: string;
              capability?: string;
            } | null;
            return (
              <li
                key={ev.id}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[9px] text-zinc-600">
                      Evidence #{String(i + 1).padStart(3, "0")}
                    </p>
                    <p className="text-[11px] text-zinc-200">
                      {payload?.capability ?? ev.category} ·{" "}
                      {payload?.checkName ?? ev.source}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase ${statusTextClass(payload?.status ?? ev.severity)}`}
                  >
                    {payload?.status ?? ev.severity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void copyOne(ev)}
                  className="mt-1.5 text-[9px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  {copiedId === ev.id ? "Copied ✓" : "Copy JSON"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
