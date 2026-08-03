/**
 * Capacitor · C4 iOS Platform (Spec: iOS Build block).
 *
 * Certifies Distribution iOS platform state transition exists:
 *   Ready for iOS → ios/ project · shell linked → Ready for Acceptance
 *
 * Requires C3 CERTIFIED + Gate authorizing CAPACITOR-004.
 * Represents `npx cap add ios` via presence of a valid Capacitor iOS project.
 * Does NOT certify IPA · simulators · App Store · signing · device APIs · C5.
 * Presence/integration only — Core Integrity Rule.
 */
import fs from "node:fs";
import path from "node:path";

export const CAPACITOR_C4_PRECONDITIONS = Object.freeze([
  "capacitor_c3_certified",
  "capacitor_gate_authorizes_004",
  "ios_platform_dir_present",
  "ios_xcode_project_present",
  "ios_capacitor_config_present",
  "ios_spm_capacitor_present",
  "capacitor_ios_dependency_present",
  "ios_open_or_sync_script_present",
  "ready_for_acceptance_spec_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const C4_ANCHORS = Object.freeze([
  {
    id: "ios_xcode_project_present",
    rel: "ios/App/App.xcodeproj/project.pbxproj",
    label: "Xcode project (cap add ios)",
    needle: /capacitor\.config\.json/,
  },
  {
    id: "ios_capacitor_config_present",
    rel: "ios/App/App/capacitor.config.json",
    label: "iOS Capacitor config (webDir · appId)",
    needle: /"webDir"\s*:\s*"\.output\/public"|"appId"\s*:/,
  },
  {
    id: "ios_spm_capacitor_present",
    rel: "ios/App/CapApp-SPM/Package.swift",
    label: "Capacitor iOS SPM (Capacitor product)",
    needle: /Capacitor|capacitor-swift-pm/,
  },
  {
    id: "capacitor_ios_dependency_present",
    rel: "package.json",
    label: "@capacitor/ios official dependency",
    needle: /"@capacitor\/ios"\s*:/,
  },
  {
    id: "ios_open_or_sync_script_present",
    rel: "package.json",
    label: "iOS sync/open prepared (cap:open:ios · cap sync)",
    needle:
      /"cap:open:ios"\s*:\s*"npx cap open ios"|"cap:sync"\s*:\s*"npx cap sync"/,
  },
  {
    id: "ready_for_acceptance_spec_present",
    rel: "docs/00-status/CAPACITOR_SPEC.md",
    label: "END Ready for Acceptance (Spec C4)",
    needle: /C4 · iOS Build[\s\S]*Ready for Acceptance/,
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
 * }} C4Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {C4Result}
 */
export function runCapacitorC4IosPlatform(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const c3Acta = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_003_C3_ACTA.md",
  );
  if (!fs.existsSync(c3Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_003_C3_ACTA.md — C4 requires C3 Android Platform CERTIFIED.",
    };
  }
  checks.push("capacitor_c3_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_GATE.md — C4 requires Gate authorizing CAPACITOR-004.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/CAPACITOR-004/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_GATE.md does not authorize CAPACITOR-004 — Land Check C3 first.",
    };
  }
  checks.push("capacitor_gate_authorizes_004");

  const iosApp = path.join(cwd, "ios", "App");
  if (!fs.existsSync(iosApp)) {
    return {
      ok: false,
      checks,
      reason: [
        "Missing ios/App — C4 requires iOS project from cap add ios.",
        "CAPACITOR-004 certifies iOS Platform only (no IPA · no App Store · no C5).",
      ].join("\n"),
    };
  }
  checks.push("ios_platform_dir_present");

  for (const anchor of C4_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — C4 requires ${anchor.label}.`,
          "CAPACITOR-004 certifies iOS Platform only (Ready for Acceptance · no IPA · no C5).",
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
    mapped_tokens: ["CAPACITOR_C4_STARTED", "CAPACITOR_C4_COMPLETED"],
    source:
      "ios/App · Xcodeproj · capacitor.config.json · CapApp-SPM · @capacitor/ios · cap open/sync · Ready for Acceptance · C3 CERTIFIED (no IPA · no App Store · no C5 · Core Integrity)",
  };
}
