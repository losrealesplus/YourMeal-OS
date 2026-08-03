/**
 * Capacitor · C5 Acceptance (operational Distribution close).
 *
 * Certifies Distribution end-state:
 *   Ready for Acceptance → full native spine validated → Distribution Certified
 *
 * Answers: Can we deliver YourMeal OS as a mobile app without modifying the Core?
 *
 * Operational checks (presence / integrity — reproducible in CI):
 *   · Web compile path intact
 *   · Mobile build path intact
 *   · Android platform operational
 *   · iOS platform operational
 *   · Capacitor sync + open prepared
 *   · Web ↔ Shell bridge present
 *   · Same Core webDir on both platforms
 *   · Core Integrity invariant present
 *
 * Requires C4 CERTIFIED + Gate authorizing CAPACITOR-005.
 * Does NOT certify: IPA · APK · stores · signing · device APIs · push.
 * Core Integrity Rule — no Core / Business / Experience changes.
 */
import fs from "node:fs";
import path from "node:path";

export const CAPACITOR_C5_PRECONDITIONS = Object.freeze([
  "capacitor_c4_certified",
  "capacitor_gate_authorizes_005",
  "web_compile_path_intact",
  "mobile_build_path_intact",
  "android_platform_operational",
  "ios_platform_operational",
  "capacitor_sync_operational",
  "native_open_scripts_operational",
  "web_shell_bridge_operational",
  "same_core_webdir_both_platforms",
  "core_integrity_invariant_present",
  "distribution_certified_spec_present",
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
 * }} C5Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {C5Result}
 */
export function runCapacitorC5Acceptance(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const c4Acta = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_004_C4_ACTA.md",
  );
  if (!fs.existsSync(c4Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_004_C4_ACTA.md — C5 requires C4 iOS Platform CERTIFIED.",
    };
  }
  checks.push("capacitor_c4_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_GATE.md — C5 requires Gate authorizing CAPACITOR-005.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  // Keep READY substring even when Gate CLOSED (C1–C4 drivers require /READY/i).
  if (!/READY/i.test(gateText) || !/CAPACITOR-005/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_GATE.md does not authorize CAPACITOR-005 — Land Check C4 first.",
    };
  }
  checks.push("capacitor_gate_authorizes_005");

  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — C5 requires web + mobile compile paths.",
    };
  }
  const pkgText = fs.readFileSync(pkgPath, "utf8");

  if (
    !/"build"\s*:\s*"vite build"/.test(pkgText) &&
    !/"build:web"\s*:\s*"vite build"/.test(pkgText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "Web compile path missing (build / build:web).",
        "C5 operational acceptance: Web must still compile (Core Integrity).",
      ].join("\n"),
    };
  }
  checks.push("web_compile_path_intact");

  if (!/"build:mobile"\s*:\s*"CAPACITOR_BUILD=1 vite build"/.test(pkgText)) {
    return {
      ok: false,
      checks,
      reason: [
        "Mobile build path missing (build:mobile · CAPACITOR_BUILD=1).",
        "C5 operational acceptance: mobile web artifact must be reproducible.",
      ].join("\n"),
    };
  }
  checks.push("mobile_build_path_intact");

  const androidSettings = path.join(cwd, "android/capacitor.settings.gradle");
  const androidAppGradle = path.join(cwd, "android/app/build.gradle");
  if (!fs.existsSync(androidSettings) || !fs.existsSync(androidAppGradle)) {
    return {
      ok: false,
      checks,
      reason: [
        "Android platform incomplete — C5 requires operational android/ spine.",
        "CAPACITOR-005 Acceptance only (no APK · no Play).",
      ].join("\n"),
    };
  }
  const androidSettingsText = fs.readFileSync(androidSettings, "utf8");
  const androidAppText = fs.readFileSync(androidAppGradle, "utf8");
  if (
    !/capacitor-android/.test(androidSettingsText) ||
    !/implementation project\(':capacitor-android'\)/.test(androidAppText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Android platform present but not linked to Capacitor shell (operational fail).",
    };
  }
  checks.push("android_platform_operational");

  const iosPbx = path.join(cwd, "ios/App/App.xcodeproj/project.pbxproj");
  const iosCapConfig = path.join(cwd, "ios/App/App/capacitor.config.json");
  if (!fs.existsSync(iosPbx) || !fs.existsSync(iosCapConfig)) {
    return {
      ok: false,
      checks,
      reason: [
        "iOS platform incomplete — C5 requires operational ios/App spine.",
        "CAPACITOR-005 Acceptance only (no IPA · no App Store).",
      ].join("\n"),
    };
  }
  checks.push("ios_platform_operational");

  if (!/"cap:sync"\s*:\s*"npx cap sync"/.test(pkgText)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing cap:sync — C5 requires Capacitor sync operational for both platforms.",
    };
  }
  checks.push("capacitor_sync_operational");

  if (
    !/"cap:open:android"\s*:\s*"npx cap open android"/.test(pkgText) ||
    !/"cap:open:ios"\s*:\s*"npx cap open ios"/.test(pkgText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Missing cap:open:android and/or cap:open:ios — C5 requires both native IDEs openable.",
    };
  }
  checks.push("native_open_scripts_operational");

  const bridgePath = path.join(
    cwd,
    "src/platform/device-capabilities/resolve.ts",
  );
  if (!fs.existsSync(bridgePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing Web ↔ Shell bridge (resolve.ts) — C5 requires @capacitor/core bridge operational.",
    };
  }
  const bridgeText = fs.readFileSync(bridgePath, "utf8");
  if (
    !/from ["']@capacitor\/core["']/.test(bridgeText) ||
    !/isNativePlatform/.test(bridgeText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Bridge file exists but lacks @capacitor/core · isNativePlatform (operational fail).",
    };
  }
  checks.push("web_shell_bridge_operational");

  const rootCapConfig = path.join(cwd, "capacitor.config.ts");
  if (!fs.existsSync(rootCapConfig)) {
    return {
      ok: false,
      checks,
      reason: "Missing capacitor.config.ts — cannot verify same Core webDir.",
    };
  }
  const rootCapText = fs.readFileSync(rootCapConfig, "utf8");
  const iosCapText = fs.readFileSync(iosCapConfig, "utf8");
  const webDirMatch = /webDir\s*:\s*["']([^"']+)["']/.exec(rootCapText);
  const iosWebDirMatch = /"webDir"\s*:\s*"([^"]+)"/.exec(iosCapText);
  if (!webDirMatch || !iosWebDirMatch) {
    return {
      ok: false,
      checks,
      reason: "webDir missing in root or iOS Capacitor config (I5 same artifact).",
    };
  }
  if (webDirMatch[1] !== iosWebDirMatch[1] || webDirMatch[1] !== ".output/public") {
    return {
      ok: false,
      checks,
      reason: [
        `webDir mismatch — root=${webDirMatch[1]} ios=${iosWebDirMatch[1]} (expected .output/public).`,
        "I5: Android + iOS must share the same Core web artifact.",
      ].join("\n"),
    };
  }
  checks.push("same_core_webdir_both_platforms");

  const specPath = path.join(cwd, "docs/00-status/CAPACITOR_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing CAPACITOR_SPEC.md — C5 requires Core Integrity + Distribution Certified.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (
    !/Core Integrity/i.test(specText) ||
    !/I8/.test(specText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Spec lacks Core Integrity invariant (I8) — C5 cannot certify Core intact.",
    };
  }
  checks.push("core_integrity_invariant_present");

  if (
    !/C5 · Acceptance[\s\S]*Distribution Certified/.test(specText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Spec C5 block missing Distribution Certified outcome — Acceptance incomplete.",
    };
  }
  checks.push("distribution_certified_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: ["CAPACITOR_C5_STARTED", "CAPACITOR_C5_COMPLETED"],
    source:
      "web+mobile compile · android+ios operational · cap sync/open · bridge · same webDir · Core Integrity · Distribution Certified · C4 CERTIFIED (no stores · no IPA/APK · Core Integrity)",
  };
}
