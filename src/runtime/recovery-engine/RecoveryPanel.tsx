/**
 * Recovery Host panel.
 */

import { useMemo, useState } from "react";
import {
  exportRecoveryHistoryDocument,
  getRecoveryEngineInfo,
  getRecoveryHistory,
  runRecovery,
} from "./RecoveryEngine";
import { getRecommendations } from "../recommendation-engine";
import { RECOVERY_ENGINE_VERSION } from "./recovery.types";
import { registerBuiltinCapabilities } from "../capability-engine";

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

export function RecoveryPanel() {
  registerBuiltinCapabilities();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const history = useMemo(() => {
    void tick;
    return getRecoveryHistory();
  }, [tick]);

  const running = history.filter((h) => h.status === "running");
  const info = useMemo(() => {
    void tick;
    return getRecoveryEngineInfo();
  }, [tick]);

  const recoverableRecs = useMemo(() => {
    void tick;
    return getRecommendations().filter((r) =>
      r.actions.some((a) => a.type === "recovery" && a.supported),
    );
  }, [tick]);

  async function runFirst() {
    const rec = recoverableRecs[0];
    if (!rec) {
      setMessage("No recoverable recommendations. Run Doctor first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await runRecovery({ recommendationId: rec.id });
      setMessage(`${result.status} · ${result.capabilityId}`);
      setTick((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  async function exportJson() {
    await writeClipboard(exportRecoveryHistoryDocument());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 p-1 text-[11px] text-zinc-200">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-tight text-zinc-100">
            Recovery
          </p>
          <p className="text-[9px] text-zinc-500">
            Orchestrator · v{RECOVERY_ENGINE_VERSION} · manual only
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runFirst()}
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5 disabled:opacity-40"
        >
          {busy ? "Running…" : "Run Queue"}
        </button>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="Queue" value={String(recoverableRecs.length)} />
        <Stat label="Running" value={String(running.length)} />
        <Stat label="History" value={String(info.history)} />
      </section>

      <section className="space-y-1">
        <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Recovery Queue
        </h3>
        {recoverableRecs.length === 0 ? (
          <p className="text-zinc-600">Empty — no supported recovery actions.</p>
        ) : (
          <ul className="space-y-1">
            {recoverableRecs.map((r) => (
              <li
                key={r.id}
                className="rounded border border-white/[0.06] px-2 py-1.5 text-[11px]"
              >
                {r.title}
                <span className="ml-2 font-mono text-[9px] text-zinc-500">
                  {r.capabilityIds.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-1">
        <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          History
        </h3>
        {history.length === 0 ? (
          <p className="text-zinc-600">No recoveries yet.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded border border-white/[0.06] px-2 py-1.5"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-[10px]">{h.capabilityId}</span>
                  <span className="font-mono text-[9px] uppercase text-zinc-400">
                    {h.status}
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500">
                  {h.finishedAt
                    ? `${h.finishedAt - h.startedAt}ms`
                    : "…"}{" "}
                  · verify {h.verifyResult?.ok ? "PASS" : h.verifyResult ? "FAIL" : "—"}
                  {" · "}
                  evidence {h.evidences.length}
                </p>
                {h.recoverMessage ? (
                  <p className="text-[9px] text-zinc-400">{h.recoverMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {message ? (
        <p className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[9px] text-zinc-400">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void exportJson()}
        className="w-full rounded-md border border-white/10 py-2 text-[11px] text-zinc-300 hover:bg-white/5"
      >
        {copied ? "Copied ✓" : "Export JSON"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
      <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
