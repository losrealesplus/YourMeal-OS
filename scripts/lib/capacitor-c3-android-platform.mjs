/**
 * Capacitor · C3 Android Platform (Spec: Android Build block).
 *
 * Certifies Distribution Android platform state transition exists:
 *   Ready for Android → android/ project · shell linked · Ready for iOS
 *
 * Requires C2 CERTIFIED + Gate authorizing CAPACITOR-003.
 * Represents `npx cap add android` via presence of a valid Capacitor Android project.
 * Does NOT certify APK/AAB · Play · emulators · signing · device APIs · C4 iOS.
 * Presence/integration only — Core Integrity Rule.
 */
import fs from "node:fs";
import path from "node:path";

export const CAPACITOR_C3_PRECONDITIONS = Object.freeze([
  "capacitor_c2_certified",
  "capacitor_gate_authorizes_003",
  "android_platform_dir_present",
  "android_capacitor_settings_present",
  "android_app_links_capacitor_present",
  "capacitor_android_dependency_present",
  "android_open_or_sync_script_present",
  "ready_for_ios_spec_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const C3_ANCHORS = Object.freeze([
  {
    id: "android_capacitor_settings_present",
    rel: "android/capacitor.settings.gradle",
    label: "cap add android (capacitor-android include)",
    needle: /include ':capacitor-android'|capacitor-android/,
  },
  {
    id: "android_app_links_capacitor_present",
    rel: "android/app/build.gradle",
    label: "Android app linked to Capacitor shell",
    needle: /implementation project\(':capacitor-android'\)/,
  },
  {
    id: "capacitor_android_dependency_present",
    rel: "package.json",
    label: "@capacitor/android official dependency",
    needle: /"@capacitor\/android"\s*:/,
  },
  {
    id: "android_open_or_sync_script_present",
    rel: "package.json",
    label: "Android sync/open prepared (cap:open:android · cap sync)",
    needle:
      /"cap:open:android"\s*:\s*"npx cap open android"|"cap:sync"\s*:\s*"npx cap sync"/,
  },
  {
    id: "ready_for_ios_spec_present",
    rel: "docs/00-status/CAPACITOR_SPEC.md",
    label: "END Ready for iOS (Spec C3)",
    needle: /C3 · Android Build[\s\S]*Ready for iOS/,
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
 * }} C3Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {C3Result}
 */
export function runCapacitorC3AndroidPlatform(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const c2Acta = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_002_C2_ACTA.md",
  );
  if (!fs.existsSync(c2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_002_C2_ACTA.md — C3 requires C2 Native Shell CERTIFIED.",
    };
  }
  checks.push("capacitor_c2_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_GATE.md — C3 requires Gate authorizing CAPACITOR-003.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/CAPACITOR-003/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_GATE.md does not authorize CAPACITOR-003 — Land Check C2 first.",
    };
  }
  checks.push("capacitor_gate_authorizes_003");

  const androidDir = path.join(cwd, "android");
  const androidSettings = path.join(androidDir, "settings.gradle");
  if (!fs.existsSync(androidDir) || !fs.existsSync(androidSettings)) {
    return {
      ok: false,
      checks,
      reason: [
        "Missing android/ platform (settings.gradle) — C3 requires Android project from cap add android.",
        "CAPACITOR-003 certifies Android Platform only (no APK · no Play · no C4).",
      ].join("\n"),
    };
  }
  checks.push("android_platform_dir_present");

  for (const anchor of C3_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — C3 requires ${anchor.label}.`,
          "CAPACITOR-003 certifies Android Platform only (Ready for iOS · no APK · no C4).",
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
    mapped_tokens: ["CAPACITOR_C3_STARTED", "CAPACITOR_C3_COMPLETED"],
    source:
      "android/ · capacitor.settings.gradle · app→capacitor-android · @capacitor/android · cap open/sync · Ready for iOS · C2 CERTIFIED (no APK · no Play · no C4 · Core Integrity)",
  };
}
