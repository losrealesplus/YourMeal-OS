/**
 * Doctor UI shared presentation helpers.
 * DEVELOPER-PLATFORM-006 — no Engine logic.
 */

import type { DoctorCheckStatus } from "../DoctorCheck";
import type { DoctorCapabilitySummary, DoctorReport } from "../DoctorReport";
import {
  DOCTOR_CAPABILITY_LABELS,
  DOCTOR_CAPABILITY_ORDER,
} from "../DoctorCapability";

export const DOCTOR_UI_VERSION = "1.3.0";

export type HealthTone = "healthy" | "degraded" | "critical" | "idle";

export function healthToneFromScore(score: number | null): HealthTone {
  if (score == null) return "idle";
  if (score >= 90) return "healthy";
  if (score >= 70) return "degraded";
  return "critical";
}

export function healthLabel(tone: HealthTone): string {
  switch (tone) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "critical":
      return "Critical";
    default:
      return "Not run";
  }
}

export function countByStatus(report: DoctorReport | null): {
  pass: number;
  warning: number;
  error: number;
  info: number;
  skip: number;
} {
  const counts = { pass: 0, warning: 0, error: 0, info: 0, skip: 0 };
  if (!report) return counts;
  for (const c of report.checks) {
    if (c.status === "fail") counts.error += 1;
    else if (c.status === "warning") counts.warning += 1;
    else if (c.status === "pass") counts.pass += 1;
    else if (c.status === "info") counts.info += 1;
    else if (c.status === "skip") counts.skip += 1;
  }
  return counts;
}

export type CapabilityRow = {
  id: string;
  label: string;
  status: DoctorCheckStatus | "coming_soon";
  comingSoon: boolean;
  summary?: DoctorCapabilitySummary;
};

/** All known capabilities — unimplemented show as Coming Soon (never hide). */
export function buildCapabilityRows(
  report: DoctorReport | null,
): CapabilityRow[] {
  const byId = new Map(
    (report?.capabilities ?? []).map((c) => [String(c.capability), c]),
  );
  return DOCTOR_CAPABILITY_ORDER.map((id) => {
    const summary = byId.get(String(id));
    if (!summary || summary.total === 0) {
      return {
        id: String(id),
        label: DOCTOR_CAPABILITY_LABELS[String(id)] ?? String(id),
        status: "coming_soon" as const,
        comingSoon: true,
      };
    }
    return {
      id: String(id),
      label: summary.label,
      status: summary.status,
      comingSoon: false,
      summary,
    };
  });
}

export function statusDotClass(status: string): string {
  switch (status) {
    case "pass":
      return "bg-emerald-400";
    case "warning":
      return "bg-amber-400";
    case "fail":
    case "error":
    case "critical":
      return "bg-rose-400";
    case "info":
      return "bg-sky-400";
    case "coming_soon":
    case "skip":
      return "bg-zinc-600";
    default:
      return "bg-zinc-500";
  }
}

export function statusTextClass(status: string): string {
  switch (status) {
    case "pass":
      return "text-emerald-400";
    case "warning":
      return "text-amber-300";
    case "fail":
    case "error":
    case "critical":
      return "text-rose-400";
    case "info":
      return "text-sky-300";
    case "coming_soon":
    case "skip":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "warning":
      return "WARNING";
    case "fail":
      return "FAIL";
    case "info":
      return "INFO";
    case "skip":
      return "SKIP";
    case "coming_soon":
      return "Coming Soon";
    default:
      return status.toUpperCase();
  }
}

export async function writeClipboard(text: string): Promise<void> {
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
