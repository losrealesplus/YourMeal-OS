/**
 * Doctor Health dashboard — immediate glance metrics.
 * DEVELOPER-PLATFORM-006
 */

import {
  countByStatus,
  healthLabel,
  healthToneFromScore,
  statusTextClass,
  type HealthTone,
} from "./doctor-ui-helpers";
import type { DoctorReport } from "../DoctorReport";

function scoreClass(tone: HealthTone): string {
  switch (tone) {
    case "healthy":
      return "text-emerald-300";
    case "degraded":
      return "text-amber-300";
    case "critical":
      return "text-rose-400";
    default:
      return "text-zinc-500";
  }
}

function toneGlyph(tone: HealthTone): string {
  switch (tone) {
    case "healthy":
      return "●";
    case "degraded":
      return "●";
    case "critical":
      return "●";
    default:
      return "○";
  }
}

export function DoctorDashboard({
  report,
  incidentCount,
  evidenceCount,
}: {
  report: DoctorReport | null;
  incidentCount: number;
  evidenceCount: number;
}) {
  const tone = healthToneFromScore(report?.healthScore ?? null);
  const counts = countByStatus(report);

  return (
    <section className="space-y-3 border-b border-white/10 pb-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Developer Health
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span
              className={`text-4xl font-semibold tabular-nums tracking-tight ${scoreClass(tone)}`}
            >
              {report ? `${report.healthScore}%` : "—"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] ${scoreClass(tone)}`}
            >
              <span aria-hidden>{toneGlyph(tone)}</span>
              {healthLabel(tone)}
            </span>
          </div>
          {report ? (
            <p className="mt-1 text-[9px] text-zinc-600">
              {report.platform} · {report.durationMs}ms · v{report.version}
            </p>
          ) : (
            <p className="mt-1 text-[9px] text-zinc-600">
              Run Doctor to compute platform health
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="PASS" value={counts.pass} tone="pass" />
        <Stat label="WARNING" value={counts.warning} tone="warning" />
        <Stat label="ERROR" value={counts.error} tone="fail" />
        <Stat label="INCIDENTS" value={incidentCount} tone="info" />
        <Stat label="EVIDENCES" value={evidenceCount} tone="info" />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
      <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-semibold tabular-nums ${statusTextClass(tone)}`}
      >
        {value}
      </p>
    </div>
  );
}
