import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorEnvironment } from "./doctor-environment.mjs";
import { makeTempRepo, writeFiles } from "./test-fixtures.mjs";
import path from "node:path";
import fs from "node:fs";

describe("doctor-environment", () => {
  it("PASS when package.json type=module and scripts/developer exist", () => {
    const cwd = makeTempRepo();
    writeFiles(cwd, {
      "package.json": JSON.stringify({ name: "x", type: "module" }),
    });
    fs.mkdirSync(path.join(cwd, "scripts", "developer"), { recursive: true });
    const r = runDoctorEnvironment({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.every((c) => c.ok));
  });

  it("FAIL when package.json missing", () => {
    const cwd = makeTempRepo();
    fs.mkdirSync(path.join(cwd, "scripts", "developer"), { recursive: true });
    const r = runDoctorEnvironment({ cwd });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("package_json_present")));
  });
});
