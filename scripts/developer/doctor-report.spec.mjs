import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDoctorResult,
  parseDoctorArgs,
  recordCheck,
} from "./doctor-shared.mjs";
import { buildDoctorSummary, printDoctorReport } from "./doctor-report.mjs";

describe("doctor-shared + doctor-report", () => {
  it("parseDoctorArgs recognizes ci/json/info", () => {
    const a = parseDoctorArgs(["--ci", "--json", "--info"]);
    assert.equal(a.ci, true);
    assert.equal(a.json, true);
    assert.equal(a.verbose, true);
    assert.equal(a.requireAndroid, false);
  });

  it("recordCheck soft does not flip ok", () => {
    const r = createDoctorResult();
    recordCheck(r, "x", false, "missing", { soft: true });
    assert.equal(r.ok, true);
    assert.equal(r.warnings.length, 1);
  });

  it("buildDoctorSummary aggregates failures", () => {
    const okMod = createDoctorResult();
    recordCheck(okMod, "a", true, "ok");
    const bad = createDoctorResult();
    recordCheck(bad, "b", false, "nope");
    const summary = buildDoctorSummary({
      mode: "default",
      modules: [
        { name: "ok", result: okMod },
        { name: "bad", result: bad },
      ],
    });
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.failed, ["bad"]);
  });

  it("printDoctorReport does not throw", () => {
    const okMod = createDoctorResult();
    recordCheck(okMod, "a", true, "ok");
    const summary = buildDoctorSummary({
      mode: "default",
      modules: [{ name: "ok", result: okMod }],
    });
    const original = console.log;
    const lines = [];
    console.log = (...args) => {
      lines.push(args.join(" "));
    };
    try {
      printDoctorReport(summary, { verbose: true });
    } finally {
      console.log = original;
    }
    assert.ok(lines.some((l) => /DEVELOPER PLATFORM/.test(l)));
    assert.ok(lines.some((l) => /status=PASS/.test(l)));
  });
});
