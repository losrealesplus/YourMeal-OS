/**
 * Capacitor · C1 Platform Preparation.
 *
 * Certifies Distribution preparation state transition exists:
 *   React/Vite SaaS → Capacitor deps + config → Ready for Native Shell
 *
 * Requires Gate READY + Spec authorizing CAPACITOR-001.
 * Does NOT open C2 (Native Shell). No android/ · no ios/ · no stores.
 * Presence/integration only — Core Integrity Rule.
 */
import fs from "node:fs";
import path from "node:path";

export const CAPACITOR_C1_PRECONDITIONS = Object.freeze([
  "capacitor_gate_authorizes_001",
  "capacitor_core_dependency_present",
  "capacitor_cli_dependency_present",
  "capacitor_config_present",
  "app_id_defined",
  "app_name_defined",
  "web_dir_defined",
  "vite_mobile_build_compat_present",
  "web_build_script_intact",
  "ready_for_native_shell_spec_present",
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
 * }} C1Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {C1Result}
 */
export function runCapacitorC1PlatformPreparation(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const gatePath = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_GATE.md — C1 requires Gate authorizing CAPACITOR-001.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/CAPACITOR-001/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_GATE.md does not authorize CAPACITOR-001 — Land Check Runner/Gate first.",
    };
  }
  checks.push("capacitor_gate_authorizes_001");

  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — C1 requires Capacitor official dependencies.",
    };
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  if (!deps["@capacitor/core"]) {
    return {
      ok: false,
      checks,
      reason: "Missing @capacitor/core — C1 requires official Capacitor core dependency.",
    };
  }
  checks.push("capacitor_core_dependency_present");

  if (!deps["@capacitor/cli"]) {
    return {
      ok: false,
      checks,
      reason: "Missing @capacitor/cli — C1 requires official Capacitor CLI dependency.",
    };
  }
  checks.push("capacitor_cli_dependency_present");

  const configPath = path.join(cwd, "capacitor.config.ts");
  if (!fs.existsSync(configPath)) {
    return {
      ok: false,
      checks,
      reason: [
        "Missing capacitor.config.ts — C1 requires institutional Capacitor configuration.",
        "CAPACITOR-001 certifies Platform Preparation only (Ready for Native Shell · no C2).",
      ].join("\n"),
    };
  }
  const configText = fs.readFileSync(configPath, "utf8");
  checks.push("capacitor_config_present");

  if (!/appId\s*:\s*["'][^"']+["']/.test(configText)) {
    return {
      ok: false,
      checks,
      reason: "capacitor.config.ts lacks appId — C1 requires App ID defined.",
    };
  }
  checks.push("app_id_defined");

  if (!/appName\s*:\s*["'][^"']+["']/.test(configText)) {
    return {
      ok: false,
      checks,
      reason: "capacitor.config.ts lacks appName — C1 requires App Name defined.",
    };
  }
  checks.push("app_name_defined");

  if (!/webDir\s*:\s*["'][^"']+["']/.test(configText)) {
    return {
      ok: false,
      checks,
      reason: "capacitor.config.ts lacks webDir — C1 requires webDir configured.",
    };
  }
  // webDir must align with Vite mobile outDir (.output/public)
  if (!/webDir\s*:\s*["']\.output\/public["']/.test(configText)) {
    return {
      ok: false,
      checks,
      reason:
        "webDir must be \".output/public\" to match Vite CAPACITOR_BUILD outDir (C1 Vite compat).",
    };
  }
  checks.push("web_dir_defined");

  const vitePath = path.join(cwd, "vite.config.ts");
  if (!fs.existsSync(vitePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing vite.config.ts — C1 requires Vite compatibility for mobile SPA build.",
    };
  }
  const viteText = fs.readFileSync(vitePath, "utf8");
  if (
    !/CAPACITOR_BUILD/.test(viteText) ||
    !/\.output\/public/.test(viteText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "vite.config.ts must support CAPACITOR_BUILD → outDir .output/public (Vite compat).",
    };
  }
  checks.push("vite_mobile_build_compat_present");

  const scripts = pkg.scripts ?? {};
  if (!scripts.build && !scripts["build:web"]) {
    return {
      ok: false,
      checks,
      reason:
        "Missing build / build:web script — Core Integrity: project must still compile as Web.",
    };
  }
  checks.push("web_build_script_intact");

  const specPath = path.join(cwd, "docs/00-status/CAPACITOR_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing CAPACITOR_SPEC.md — C1 requires Spec C1 Ready for Native Shell.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (
    !/C1 · Platform Preparation[\s\S]*Ready for Native Shell/.test(specText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "CAPACITOR_SPEC.md lacks C1 · Platform Preparation → Ready for Native Shell handoff.",
    };
  }
  checks.push("ready_for_native_shell_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: ["CAPACITOR_C1_STARTED", "CAPACITOR_C1_COMPLETED"],
    source:
      "@capacitor/core+cli · capacitor.config.ts (appId·appName·webDir) · Vite CAPACITOR_BUILD · web build intact · Ready for Native Shell · Gate READY (no C2 · no android/ios certify · no stores · Core Integrity)",
  };
}
