/**
 * DoctorPanel — Developer Platform Doctor UI (v1.3).
 * Presentation only — does not change Doctor Engine or Incident Engine logic.
 * DEVELOPER-PLATFORM-006
 *
 * Spec: docs/05-architecture/DOCTOR_UI.md
 * ADR: docs/adr/0042-doctor-ui.md
 */

import { useEffect, useMemo, useState } from "react";
import {
  dismissIncident,
  exportIncidents,
  getIncidentTimeline,
  getOpenIncidents,
} from "../incident-engine";
import {
  matchManyIncidents,
  registerFoundationKnowledge,
  type KnowledgeMatchInput,
} from "../knowledge-engine";
import type { DoctorReport } from "./DoctorReport";
import { runDoctor } from "./DoctorRunner";
import {
  getLastDoctorReportJson,
  setLastDoctorReportJson,
} from "./DoctorSession";
import { DoctorActions } from "./ui/DoctorActions";
import { DoctorCapabilities } from "./ui/DoctorCapabilities";
import { DoctorDashboard } from "./ui/DoctorDashboard";
import { DoctorEvidenceSection } from "./ui/DoctorEvidenceSection";
import { DoctorIncidentsSection } from "./ui/DoctorIncidentsSection";
import { DoctorKnowledgeSection } from "./ui/DoctorKnowledgeSection";
import { DoctorRecommendations } from "./ui/DoctorRecommendations";
import { DoctorTimelineSection } from "./ui/DoctorTimelineSection";
import {
  DOCTOR_UI_VERSION,
  writeClipboard,
} from "./ui/doctor-ui-helpers";

function parseCachedReport(): DoctorReport | null {
  const raw = getLastDoctorReportJson();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DoctorReport;
  } catch {
    return null;
  }
}

export function DoctorPanel() {
  const [report, setReport] = useState<DoctorReport | null>(() =>
    parseCachedReport(),
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const incidents = useMemo(() => {
    void tick;
    return getOpenIncidents();
  }, [tick, report]);

  const timeline = useMemo(() => {
    void tick;
    return getIncidentTimeline({ limit: 80 });
  }, [tick, report]);

  const recommendations = useMemo(() => {
    const fromReport = report?.recommendations ?? [];
    const fromIncidents = incidents
      .map((i) => i.recommendation)
      .filter((r): r is string => Boolean(r));
    return [...fromReport, ...fromIncidents];
  }, [report, incidents]);

  const knowledgeMatches = useMemo(() => {
    void tick;
    registerFoundationKnowledge();
    const inputs: KnowledgeMatchInput[] = [
      ...incidents.map((i) => ({
        title: i.title,
        description: i.description,
        capability: i.capability,
        category: i.category,
        checkId: i.checkId,
      })),
      ...(report?.checks
        .filter((c) => c.status === "fail" || c.status === "warning")
        .map((c) => ({
          title: c.name,
          description: c.message,
          capability: String(c.capability),
          checkId: c.id,
        })) ?? []),
    ];
    return matchManyIncidents(inputs);
  }, [tick, report, incidents]);

  useEffect(() => {
    // Refresh incident/timeline views when panel mounts after a prior Doctor run.
    registerFoundationKnowledge();
    setTick((n) => n + 1);
  }, []);

  async function onRun() {
    setRunning(true);
    setError(null);
    try {
      const next = await runDoctor();
      setReport(next);
      setLastDoctorReportJson(JSON.stringify(next));
      setSelectedIncident(null);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function onCopyReport() {
    if (!report) return;
    await writeClipboard(JSON.stringify(report, null, 2));
    setCopiedReport(true);
    window.setTimeout(() => setCopiedReport(false), 2000);
  }

  async function onExportJson() {
    if (!report) return;
    const payload = {
      product: "YourMeal OS Developer Platform",
      doctorUi: DOCTOR_UI_VERSION,
      exportedAt: new Date().toISOString(),
      doctor: report,
      incidents: exportIncidents(),
      timeline: getIncidentTimeline(),
      knowledge: knowledgeMatches.map((m) => ({
        id: m.article.id,
        title: m.article.title,
        score: m.score,
        matchedOn: m.matchedOn,
      })),
    };
    await writeClipboard(JSON.stringify(payload, null, 2));
    setCopiedExport(true);
    window.setTimeout(() => setCopiedExport(false), 2000);
    setTick((n) => n + 1);
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 p-1 text-[11px] text-zinc-200">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-tight text-zinc-100">
            Doctor
          </p>
          <p className="text-[9px] text-zinc-500">
            Developer Platform · UI v{DOCTOR_UI_VERSION} · glance diagnostics
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-rose-300">
          {error}
        </p>
      ) : null}

      <DoctorDashboard
        report={report}
        incidentCount={incidents.length}
        evidenceCount={report?.evidences.length ?? 0}
      />

      <DoctorCapabilities report={report} />

      <DoctorIncidentsSection
        incidents={incidents}
        selectedId={selectedIncident}
        onSelect={setSelectedIncident}
        onDismiss={(id) => {
          dismissIncident(id);
          setSelectedIncident(null);
          setTick((n) => n + 1);
        }}
      />

      <DoctorKnowledgeSection matches={knowledgeMatches} />

      <DoctorRecommendations items={recommendations} />

      <DoctorTimelineSection events={timeline} />

      <DoctorEvidenceSection evidences={report?.evidences ?? []} />

      <DoctorActions
        running={running}
        hasReport={Boolean(report)}
        copiedReport={copiedReport}
        copiedExport={copiedExport}
        onRun={() => void onRun()}
        onCopyReport={() => void onCopyReport()}
        onExportJson={() => void onExportJson()}
      />
    </div>
  );
}
