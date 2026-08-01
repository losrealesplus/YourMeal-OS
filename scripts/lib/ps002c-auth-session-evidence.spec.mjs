import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAuthSession002Evidence,
  formatAuthSession002Report,
  parseAuthSession002Args,
} from "./ps002c-auth-session-evidence.mjs";

describe("ps002c-auth-session-evidence (AUTH-SESSION-002)", () => {
  it("parses START/END args", () => {
    const start = parseAuthSession002Args(
      [
        "[AUTH-SESSION-002]",
        "START",
        { step: "getSession", pending: "getSession", lastCompleted: null },
      ],
      "",
      1,
    );
    assert.equal(start?.phase, "START");
    assert.equal(start?.detail.step, "getSession");
  });

  it("detects hung step when START has no END", () => {
    const events = [
      parseAuthSession002Args([
        "[AUTH-SESSION-002]",
        "START",
        { step: "getSession" },
      ]),
      parseAuthSession002Args([
        "[AUTH-SESSION-002]",
        "END",
        { step: "getSession", durationMs: 12, ok: true },
      ]),
      parseAuthSession002Args([
        "[AUTH-SESSION-002]",
        "START",
        { step: "ensurePlatformOwnerSession" },
      ]),
    ].filter(Boolean);

    const evidence = buildAuthSession002Evidence(events);
    assert.equal(evidence.pending, "ensurePlatformOwnerSession");
    assert.equal(evidence.lastCompleted, "getSession");
    assert.equal(evidence.durationsMs.getSession, 12);
    assert.match(formatAuthSession002Report(evidence), /ensurePlatformOwnerSession/);
  });

  it("SUMMARY clears pending when effect finished", () => {
    const events = [
      parseAuthSession002Args([
        "[AUTH-SESSION-002]",
        "END",
        { step: "loadRoles", durationMs: 5 },
      ]),
      parseAuthSession002Args([
        "[AUTH-SESSION-002]",
        "SUMMARY",
        {
          lastCompleted: "loadRoles",
          pending: null,
          durationsMs: { getSession: 1, ensurePlatformOwnerSession: 2, loadRoles: 5 },
        },
      ]),
    ].filter(Boolean);

    const evidence = buildAuthSession002Evidence(events);
    assert.equal(evidence.pending, null);
    assert.equal(evidence.lastCompleted, "loadRoles");
    assert.match(evidence.diagnosis.note, /SUMMARY/);
  });
});
