import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorVite } from "./doctor-vite.mjs";
import { makeTempRepo, writeMinimalPlatformFixture, writeFiles } from "./test-fixtures.mjs";

describe("doctor-vite", () => {
  it("PASS when vite config and scripts exist", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    const r = runDoctorVite({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL without vite dependency", () => {
    const cwd = makeTempRepo();
    writeFiles(cwd, {
      "vite.config.ts": "export default {};\n",
      "package.json": JSON.stringify({
        type: "module",
        scripts: { dev: "vite dev", build: "vite build" },
        dependencies: {},
      }),
    });
    const r = runDoctorVite({ cwd });
    assert.equal(r.ok, false);
  });
});
