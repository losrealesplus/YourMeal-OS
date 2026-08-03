/**
 * Unit tests for Capacitor C1 Platform Preparation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CAPACITOR_C1_PRECONDITIONS,
  runCapacitorC1PlatformPreparation,
} from "./capacitor-c1-platform-preparation.mjs";

function writeC1Fixtures(cwd, { gateOk = true } = {}) {
  const files = {
    "package.json": JSON.stringify(
      {
        dependencies: {
          "@capacitor/core": "^8.0.0",
          "@capacitor/cli": "^8.0.0",
        },
        scripts: {
          build: "vite build",
          "build:web": "vite build",
        },
      },
      null,
      2,
    ),
    "capacitor.config.ts":
      'export default {\n  appId: "com.yourmealos.app",\n  appName: "YourMealOS",\n  webDir: ".output/public",\n};\n',
    "vite.config.ts":
      'const mobileSpa = process.env.CAPACITOR_BUILD === "1";\nexport default { outDir: ".output/public" };\n',
    "docs/00-status/CAPACITOR_SPEC.md":
      "### C1 · Platform Preparation\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Ready for Native Shell |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/capacitor");
  fs.mkdirSync(gateDir, { recursive: true });
  fs.writeFileSync(
    path.join(gateDir, "CAPACITOR_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nCAPACITOR-001 · C1 Platform Preparation\n"
      : "# Gate\n**Estado:** READY\nRunner only\n",
  );
}

describe("capacitor-c1-platform-preparation", () => {
  it("lists expected C1 check ids", () => {
    assert.equal(CAPACITOR_C1_PRECONDITIONS.length, 10);
    assert.ok(
      CAPACITOR_C1_PRECONDITIONS.includes("capacitor_gate_authorizes_001"),
    );
    assert.ok(
      CAPACITOR_C1_PRECONDITIONS.includes("ready_for_native_shell_spec_present"),
    );
  });

  it("PASS when Gate READY and preparation anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c1-"));
    writeC1Fixtures(cwd);
    const r = runCapacitorC1PlatformPreparation({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...CAPACITOR_C1_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "CAPACITOR_C1_STARTED",
      "CAPACITOR_C1_COMPLETED",
    ]);
  });

  it("FAIL when Gate does not authorize CAPACITOR-001", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c1-"));
    writeC1Fixtures(cwd, { gateOk: false });
    const r = runCapacitorC1PlatformPreparation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CAPACITOR-001/);
  });

  it("FAIL when capacitor.config.ts is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c1-"));
    writeC1Fixtures(cwd);
    fs.unlinkSync(path.join(cwd, "capacitor.config.ts"));
    const r = runCapacitorC1PlatformPreparation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /capacitor\.config/);
  });
});
