import { describe, expect, it } from "vitest";
import type { DoctorReport } from "../DoctorReport";
import {
  buildCapabilityRows,
  countByStatus,
  healthLabel,
  healthToneFromScore,
} from "./doctor-ui-helpers";

function emptyReport(partial: Partial<DoctorReport> = {}): DoctorReport {
  return {
    version: "1.1.0",
    runAt: new Date().toISOString(),
    platform: "web",
    healthScore: 100,
    ok: true,
    checks: [],
    capabilities: [],
    evidences: [],
    recommendations: [],
    durationMs: 1,
    ...partial,
  };
}

describe("Doctor UI helpers", () => {
  it("maps health tones from score", () => {
    expect(healthToneFromScore(null)).toBe("idle");
    expect(healthToneFromScore(97)).toBe("healthy");
    expect(healthToneFromScore(75)).toBe("degraded");
    expect(healthToneFromScore(40)).toBe("critical");
    expect(healthLabel("healthy")).toBe("Healthy");
  });

  it("counts check statuses including errors from fail", () => {
    const report = emptyReport({
      checks: [
        {
          id: "a",
          name: "A",
          capability: "runtime",
          status: "pass",
          message: "",
          recommendations: [],
          durationMs: 1,
        },
        {
          id: "b",
          name: "B",
          capability: "runtime",
          status: "warning",
          message: "",
          recommendations: [],
          durationMs: 1,
        },
        {
          id: "c",
          name: "C",
          capability: "assets",
          status: "fail",
          message: "",
          recommendations: [],
          durationMs: 1,
        },
      ],
    });
    expect(countByStatus(report)).toEqual({
      pass: 1,
      warning: 1,
      error: 1,
      info: 0,
      skip: 0,
    });
  });

  it("lists all capabilities and marks missing as Coming Soon", () => {
    const report = emptyReport({
      capabilities: [
        {
          capability: "runtime",
          label: "Runtime",
          status: "pass",
          pass: 1,
          warning: 0,
          fail: 0,
          info: 0,
          skip: 0,
          total: 1,
        },
        {
          capability: "android",
          label: "Android",
          status: "warning",
          pass: 0,
          warning: 1,
          fail: 0,
          info: 0,
          skip: 0,
          total: 1,
        },
      ],
    });
    const rows = buildCapabilityRows(report);
    expect(rows.find((r) => r.id === "runtime")?.comingSoon).toBe(false);
    expect(rows.find((r) => r.id === "android")?.status).toBe("warning");
    expect(rows.find((r) => r.id === "network")?.comingSoon).toBe(true);
    expect(rows.find((r) => r.id === "storage")?.status).toBe("coming_soon");
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it("treats null report as all Coming Soon", () => {
    const rows = buildCapabilityRows(null);
    expect(rows.every((r) => r.comingSoon)).toBe(true);
  });
});
