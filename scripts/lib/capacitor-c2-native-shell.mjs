/**
 * Capacitor · C2 Native Shell.
 *
 * Certifies Distribution shell state transition exists:
 *   Ready for Native Shell → Capacitor integrated → Ready for Android/iOS
 *
 * Requires C1 CERTIFIED + Gate authorizing CAPACITOR-002.
 * Does NOT open C3/C4 (Android/iOS builds). No cap add · no stores · no plugins.
 * Presence/integration only — Core Integrity Rule.
 *
 * "cap init" is represented by institutional capacitor.config.ts + CLI tooling,
 * not by re-running init. Platforms (android/ios) belong to C3/C4.
 */
import fs from "node:fs";
import path from "node:path";

export const CAPACITOR_C2_PRECONDITIONS = Object.freeze([
  "capacitor_c1_certified",
  "capacitor_gate_authorizes_002",
  "native_shell_config_init_present",
  "shell_sync_script_present",
  "mobile_build_pipeline_present",
  "web_shell_bridge_present",
  "shell_artifact_verifier_present",
  "ready_for_android_ios_spec_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const C2_ANCHORS = Object.freeze([
  {
    id: "native_shell_config_init_present",
    rel: "capacitor.config.ts",
    label: "Native Shell init (CapacitorConfig · appId · webDir)",
    needle: /import type \{ CapacitorConfig \} from ["']@capacitor\/cli["'][\s\S]*appId[\s\S]*webDir/,
  },
  {
    id: "shell_sync_script_present",
    rel: "package.json",
    label: "Shell sync (npx cap sync / sync:mobile)",
    needle: /"cap:sync"\s*:\s*"npx cap sync"|"sync:mobile"\s*:\s*"[^"]*cap sync/,
  },
  {
    id: "mobile_build_pipeline_present",
    rel: "package.json",
    label: "Web → Shell build pipeline (build:mobile)",
    needle: /"build:mobile"\s*:\s*"CAPACITOR_BUILD=1 vite build"/,
  },
  {
    id: "web_shell_bridge_present",
    rel: "src/platform/device-capabilities/resolve.ts",
    label: "Web ↔ Shell bridge (@capacitor/core · isNativePlatform)",
    needle: /from ["']@capacitor\/core["'][\s\S]*isNativePlatform/,
  },
  {
    id: "shell_artifact_verifier_present",
    rel: "scripts/verify-mobile-shell.mjs",
    label: "Shell artifact verifier (.output/public)",
    needle: /\.output.*public|mobile shell/,
  },
  {
    id: "ready_for_android_ios_spec_present",
    rel: "docs/00-status/CAPACITOR_SPEC.md",
    label: "END Ready for Android / iOS (Spec C2)",
    needle: /C2 · Native Shell[\s\S]*Ready for Android \/ iOS/,
  },
]);

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} C2Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {C2Result}
 */
export function runCapacitorC2NativeShell(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const c1Acta = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_001_C1_ACTA.md",
  );
  if (!fs.existsSync(c1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_001_C1_ACTA.md — C2 requires C1 Platform Preparation CERTIFIED.",
    };
  }
  checks.push("capacitor_c1_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_GATE.md — C2 requires Gate authorizing CAPACITOR-002.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/CAPACITOR-002/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_GATE.md does not authorize CAPACITOR-002 — Land Check C1 first.",
    };
  }
  checks.push("capacitor_gate_authorizes_002");

  for (const anchor of C2_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — C2 requires ${anchor.label}.`,
          "CAPACITOR-002 certifies Native Shell only (Ready for Android/iOS · no C3/C4).",
        ].join("\n"),
      };
    }
    if (anchor.needle) {
      const text = fs.readFileSync(p, "utf8");
      if (!anchor.needle.test(text)) {
        return {
          ok: false,
          checks,
          reason: `Anchor ${anchor.rel} exists but lacks ${anchor.label} marker.`,
        };
      }
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["CAPACITOR_C2_STARTED", "CAPACITOR_C2_COMPLETED"],
    source:
      "cap init→config · cap sync · build:mobile · @capacitor/core bridge · shell verifier · Ready for Android/iOS · C1 CERTIFIED (no C3/C4 · no cap add · no stores · Core Integrity)",
  };
}
