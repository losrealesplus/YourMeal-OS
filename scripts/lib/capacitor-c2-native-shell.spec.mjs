/**
 * Unit tests for Capacitor C2 Native Shell.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CAPACITOR_C2_PRECONDITIONS,
  runCapacitorC2NativeShell,
} from "./capacitor-c2-native-shell.mjs";

function writeC2Fixtures(cwd, { gateOk = true, c1Ok = true } = {}) {
  const files = {
    "capacitor.config.ts":
      'import type { CapacitorConfig } from "@capacitor/cli";\nconst config: CapacitorConfig = {\n  appId: "com.yourmealos.app",\n  appName: "YourMealOS",\n  webDir: ".output/public",\n};\nexport default config;\n',
    "package.json": JSON.stringify(
      {
        scripts: {
          "build:mobile": "CAPACITOR_BUILD=1 vite build",
          "cap:sync": "npx cap sync",
          "sync:mobile": "npm run build:mobile && npx cap sync",
        },
      },
      null,
      2,
    ),
    "src/platform/device-capabilities/resolve.ts":
      'import { Capacitor } from "@capacitor/core";\nexport function isNative() {\n  return Capacitor.isNativePlatform();\n}\n',
    "scripts/verify-mobile-shell.mjs":
      'const publicDir = ".output/public";\nconsole.log("PASS · mobile shell");\n',
    "docs/00-status/CAPACITOR_SPEC.md":
      "### C2 · Native Shell\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Ready for Android / iOS |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/capacitor");
  fs.mkdirSync(gateDir, { recursive: true });
  if (c1Ok) {
    fs.writeFileSync(
      path.join(gateDir, "CAPACITOR_001_C1_ACTA.md"),
      "# CAPACITOR-001 · C1 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "CAPACITOR_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nCAPACITOR-002 · C2 Native Shell\n"
      : "# Gate\n**Estado:** READY\nCAPACITOR-001 only\n",
  );
}

describe("capacitor-c2-native-shell", () => {
  it("lists expected C2 check ids", () => {
    assert.equal(CAPACITOR_C2_PRECONDITIONS.length, 8);
    assert.ok(CAPACITOR_C2_PRECONDITIONS.includes("capacitor_c1_certified"));
    assert.ok(
      CAPACITOR_C2_PRECONDITIONS.includes("ready_for_android_ios_spec_present"),
    );
  });

  it("PASS when C1 CERTIFIED and Native Shell anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c2-"));
    writeC2Fixtures(cwd);
    const r = runCapacitorC2NativeShell({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...CAPACITOR_C2_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "CAPACITOR_C2_STARTED",
      "CAPACITOR_C2_COMPLETED",
    ]);
  });

  it("FAIL when C1 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c2-"));
    writeC2Fixtures(cwd, { c1Ok: false });
    const r = runCapacitorC2NativeShell({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /C1|CAPACITOR_001/);
  });

  it("FAIL when Gate does not authorize CAPACITOR-002", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c2-"));
    writeC2Fixtures(cwd, { gateOk: false });
    const r = runCapacitorC2NativeShell({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CAPACITOR-002/);
  });
});
