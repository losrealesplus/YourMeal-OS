import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorNetwork } from "./doctor-network.mjs";

describe("doctor-network", () => {
  it("skips cleanly with --skip-network", async () => {
    const r = await runDoctorNetwork({ skipNetwork: true });
    assert.equal(r.ok, true);
    assert.equal(r.evidence.skipped, true);
  });

  it("PASS against example.com probe URL", async () => {
    const r = await runDoctorNetwork({
      env: {
        ...process.env,
        YMOS_DOCTOR_PROBE_URL: "https://example.com",
      },
      skipNetwork: false,
      ci: false,
    });
    assert.equal(r.ok, true);
    assert.ok(r.evidence.httpStatus);
  });

  it("soft-PASS in CI when host unreachable", async () => {
    const r = await runDoctorNetwork({
      env: {
        ...process.env,
        YMOS_DOCTOR_PROBE_URL: "https://invalid.invalid.example.invalid",
      },
      ci: true,
      skipNetwork: false,
    });
    assert.equal(r.ok, true);
  });
});
