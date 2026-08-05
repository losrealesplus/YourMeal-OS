/**
 * Capabilities panel — registry glance (Recover Supported YES/NO).
 */

import { useMemo, useState } from "react";
import { capabilityHealth } from "./CapabilityHealth";
import { listCapabilities } from "./CapabilityRegistry";
import { registerBuiltinCapabilities } from "./capabilities/foundation";
import {
  runCapability,
  type CapabilityRunResult,
} from "./CapabilityRunner";
import { CAPABILITY_ENGINE_VERSION } from "./capability.types";
import type { CapabilityPlatform } from "./capability.types";

function detectPlatform(): CapabilityPlatform {
  try {
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor;
    const p = cap?.getPlatform?.() ?? "web";
    if (p === "android" || p === "ios" || p === "web") return p;
    return "web";
  } catch {
    return "web";
  }
}

export function CapabilitiesPanel() {
  registerBuiltinCapabilities();
  const [tick, setTick] = useState(0);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [last, setLast] = useState<CapabilityRunResult | null>(null);

  const rows = useMemo(() => {
    void tick;
    return listCapabilities().map((c) => ({
      capability: c,
      health: capabilityHealth(c),
    }));
  }, [tick, last]);

  async function diagnoseOne(id: string) {
    setRunningId(id);
    try {
      const result = await runCapability(id, {
        platform: detectPlatform(),
        runAt: new Date().toISOString(),
      });
      setLast(result);
      setTick((n) => n + 1);
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 p-1 text-[11px] text-zinc-200">
      <header>
        <p className="text-[10px] font-semibold tracking-tight text-zinc-100">
          Capabilities
        </p>
        <p className="text-[9px] text-zinc-500">
          Capability Engine · v{CAPABILITY_ENGINE_VERSION} · diagnose contract
        </p>
      </header>

      <ul className="max-h-72 space-y-1.5 overflow-y-auto">
        {rows.map(({ capability, health }) => (
          <li
            key={capability.id}
            className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] text-zinc-100">{capability.name}</p>
                <p className="font-mono text-[9px] text-zinc-600">
                  {capability.id} · {capability.category}
                </p>
              </div>
              <span className="font-mono text-[9px] uppercase text-zinc-400">
                {health.state}
              </span>
            </div>
            <p className="mt-1 font-mono text-[9px] text-zinc-500">
              platforms: {capability.supportedPlatforms.join(", ")}
            </p>
            <p className="font-mono text-[9px] text-zinc-500">
              checks: {health.lastResults.length || "—"} · health:{" "}
              {health.state}
            </p>
            <p className="mt-1 font-mono text-[9px]">
              <span
                className={
                  health.recoverSupported ? "text-emerald-400" : "text-zinc-600"
                }
              >
                Recover {health.recoverSupported ? "YES" : "NO"}
              </span>
              {" · "}
              <span
                className={
                  health.verifySupported ? "text-emerald-400" : "text-zinc-600"
                }
              >
                Verify {health.verifySupported ? "YES" : "NO"}
              </span>
            </p>
            <button
              type="button"
              disabled={runningId === capability.id}
              onClick={() => void diagnoseOne(capability.id)}
              className="mt-1.5 rounded border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400 hover:bg-white/5 disabled:opacity-40"
            >
              {runningId === capability.id ? "Diagnosing…" : "Diagnose"}
            </button>
          </li>
        ))}
      </ul>

      {last ? (
        <p className="font-mono text-[9px] text-zinc-500">
          Last: {last.capability.id} · {last.results.length} checks ·{" "}
          {last.health.state}
        </p>
      ) : null}
    </div>
  );
}
