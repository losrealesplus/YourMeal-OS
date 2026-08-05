/**
 * DoctorPanel — minimal Host UI for Developer Platform v1.1 Doctor Engine.
 * Full visual polish can expand in a follow-up; Engine is the product here.
 * DEVELOPER-PLATFORM-004
 */

import { useState } from "react";
import type { DoctorReport } from "./DoctorReport";
import { runDoctor } from "./DoctorRunner";
import { setLastDoctorReportJson } from "./DoctorSession";

function statusColor(status: string): string {
  switch (status) {
    case "pass":
      return "text-emerald-400";
    case "warning":
      return "text-amber-300";
    case "fail":
      return "text-rose-400";
    case "info":
      return "text-sky-300";
    case "skip":
      return "text-zinc-500";
    default:
      return "text-zinc-300";
  }
}

function statusGlyph(status: string): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "warning":
      return "WARN";
    case "fail":
      return "FAIL";
    case "info":
      return "INFO";
    case "skip":
      return "SKIP";
    default:
      return status.toUpperCase();
  }
}

export function DoctorPanel() {
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onRun() {
    setRunning(true);
    setError(null);
    try {
      const next = await runDoctor();
      setReport(next);
      setLastDoctorReportJson(JSON.stringify(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function onCopy() {
    if (!report) return;
    const text = JSON.stringify(report, null, 2);
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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 p-1 text-[11px] text-zinc-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Doctor
          </p>
          <p className="text-[9px] text-zinc-500">
            Capabilities → Checks → Evidence · registerCheck()
          </p>
        </div>
        <button
          type="button"
          disabled={running}
          onClick={() => void onRun()}
          className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {running ? "Running…" : "Run Doctor"}
        </button>
      </div>

      {error ? (
        <p className="text-rose-400">{error}</p>
      ) : null}

      {!report && !running ? (
        <p className="text-zinc-500">
          Run Doctor to compute Health Score across registered checks.
        </p>
      ) : null}

      {report ? (
        <>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
              Health Score
            </p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                report.healthScore >= 90
                  ? "text-emerald-300"
                  : report.healthScore >= 70
                    ? "text-amber-300"
                    : "text-rose-400"
              }`}
            >
              {report.healthScore}%
            </p>
            <p className="mt-1 text-[9px] text-zinc-500">
              {report.checks.length} checks · {report.durationMs}ms ·{" "}
              {report.platform} · v{report.version}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Capabilities
            </p>
            <ul className="space-y-1">
              {report.capabilities.map((cap) => (
                <li
                  key={cap.capability}
                  className="flex items-center justify-between gap-2 border-b border-white/5 py-1"
                >
                  <span className="text-zinc-200">{cap.label}</span>
                  <span
                    className={`font-mono text-[10px] ${statusColor(cap.status)}`}
                  >
                    {statusGlyph(cap.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Checks
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {report.checks.map((c) => (
                <li key={c.id} className="border-b border-white/5 py-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-300">{c.name}</span>
                    <span
                      className={`shrink-0 font-mono text-[10px] ${statusColor(c.status)}`}
                    >
                      {statusGlyph(c.status)}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-500">{c.message}</p>
                  {c.recommendations.length > 0 ? (
                    <ul className="mt-0.5 list-inside list-disc text-[9px] text-amber-200/80">
                      {c.recommendations.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {report.evidences.length > 0 ? (
            <p className="text-[9px] text-zinc-500">
              FOPEBA evidence emitted: {report.evidences.length}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void onCopy()}
            className="w-full rounded-lg border border-sky-400/40 bg-sky-500/10 py-2 text-center text-[11px] font-bold text-sky-200 hover:bg-sky-500/20"
          >
            {copied ? "Report Copied ✓" : "Copy Doctor Report"}
          </button>
        </>
      ) : null}
    </div>
  );
}
