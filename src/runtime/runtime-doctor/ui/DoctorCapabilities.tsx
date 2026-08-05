/**
 * Capabilities matrix — all known capabilities; unimplemented = Coming Soon.
 */

import { useState } from "react";
import type { DoctorExecutedCheck, DoctorReport } from "../DoctorReport";
import {
  buildCapabilityRows,
  statusDotClass,
  statusLabel,
  statusTextClass,
} from "./doctor-ui-helpers";

export function DoctorCapabilities({ report }: { report: DoctorReport | null }) {
  const rows = buildCapabilityRows(report);
  const [openId, setOpenId] = useState<string | null>(null);

  const checksByCap = new Map<string, DoctorExecutedCheck[]>();
  for (const c of report?.checks ?? []) {
    const key = String(c.capability);
    const list = checksByCap.get(key) ?? [];
    list.push(c);
    checksByCap.set(key, list);
  }

  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Capabilities
      </h3>
      <ul className="divide-y divide-white/[0.06] rounded-md border border-white/[0.06]">
        {rows.map((row) => {
          const expanded = openId === row.id;
          const checks = checksByCap.get(row.id) ?? [];
          const canExpand = !row.comingSoon && checks.length > 0;
          return (
            <li key={row.id}>
              <button
                type="button"
                disabled={!canExpand}
                onClick={() =>
                  setOpenId((cur) => (cur === row.id ? null : row.id))
                }
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] disabled:cursor-default"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(row.status)}`}
                    aria-hidden
                  />
                  <span className="text-[12px] text-zinc-200">{row.label}</span>
                </span>
                <span
                  className={`font-mono text-[10px] ${statusTextClass(row.status)}`}
                >
                  {statusLabel(row.status)}
                  {canExpand ? (expanded ? "  ▾" : "  ▸") : ""}
                </span>
              </button>
              {expanded ? (
                <ul className="space-y-1 border-t border-white/[0.04] bg-black/20 px-3 py-2">
                  {checks.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-2 py-1"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-300">{c.name}</p>
                        <p className="truncate text-[9px] text-zinc-600">
                          {c.message}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-[10px] ${statusTextClass(c.status)}`}
                      >
                        {statusLabel(c.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
