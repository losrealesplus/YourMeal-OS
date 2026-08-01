import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildHomePathGapEvidence,
  formatHomePathGapReport,
  parseFcr008Args,
} from "./ps002c-home-path-evidence.mjs";

describe("ps002c-home-path-evidence (HOME-PATH-002)", () => {
  it("parses console.info args [tag, step, detail]", () => {
    const ev = parseFcr008Args(
      [
        "[FCR-008]",
        "ROLE_READY",
        { userId: "u1", roles: ["customer"], pipelineId: "pl-1" },
      ],
      "[FCR-008] ROLE_READY JSHandle@object",
      100,
    );
    assert.ok(ev);
    assert.equal(ev.step, "ROLE_READY");
    assert.deepEqual(ev.detail.roles, ["customer"]);
    assert.equal(ev.detail.userId, "u1");
  });

  it("normalizes HOME_PATH alias", () => {
    const ev = parseFcr008Args(["[FCR-008]", "HOME_PATH", { path: "/admin" }]);
    assert.equal(ev?.step, "HOME_PATH_RESOLVED");
  });

  it("diagnoses not_staff with roles from ROLE_READY", () => {
    const events = [
      parseFcr008Args([
        "[FCR-008]",
        "MEMBERSHIP_READY",
        { userId: "u1", roleCount: 0 },
      ]),
      parseFcr008Args([
        "[FCR-008]",
        "ROLE_READY",
        { userId: "u1", roles: [] },
      ]),
      parseFcr008Args([
        "[FCR-008]",
        "STOP",
        { reason: "not_staff", userId: "u1", route: "/auth/admin" },
      ]),
    ].filter(Boolean);

    const gap = buildHomePathGapEvidence(events);
    assert.equal(gap.diagnosis.gap, "ROLE_READY_WITHOUT_HOME_PATH_RESOLVED");
    assert.equal(gap.diagnosis.is_not_staff, true);
    assert.equal(gap.diagnosis.stop_reason, "not_staff");
    assert.deepEqual(gap.diagnosis.roles_at_role_ready, []);
    assert.equal(gap.role_ready?.roleCount, 0);
    assert.equal(gap.stop?.reason, "not_staff");
    assert.equal(gap.home_path_resolved, null);

    const report = formatHomePathGapReport(gap);
    assert.match(report, /not_staff confirmed/i);
    assert.match(report, /roles_at_role_ready: \[\]/);
  });

  it("does not claim not_staff for other STOP reasons", () => {
    const events = [
      parseFcr008Args([
        "[FCR-008]",
        "ROLE_READY",
        { userId: "u1", roles: ["company_admin"] },
      ]),
      parseFcr008Args([
        "[FCR-008]",
        "STOP",
        {
          reason: "auth_admin_submit_error",
          message: "boom",
          userId: "u1",
        },
      ]),
    ].filter(Boolean);

    const gap = buildHomePathGapEvidence(events);
    assert.equal(gap.diagnosis.is_not_staff, false);
    assert.equal(gap.stop?.message, "boom");
    assert.deepEqual(gap.diagnosis.roles_at_role_ready, ["company_admin"]);
    assert.match(formatHomePathGapReport(gap), /not not_staff/);
  });

  it("falls back to text when args lack step", () => {
    const ev = parseFcr008Args([], "[FCR-008] STOP {reason: not_staff}", 1);
    assert.equal(ev?.step, "STOP");
  });
});
