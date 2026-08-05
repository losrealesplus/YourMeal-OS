import { afterEach, describe, expect, it } from "vitest";
import {
  findModule,
  registerBuiltinRuntimeModules,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetBuiltinRegistrationFlag } from "../runtime-core/register-builtins";
import { resetModuleRenderers } from "../runtime-host";
import {
  BUILTIN_DOCTOR_CHECK_IDS,
  computeHealthScore,
  getChecks,
  registerBuiltinDoctorChecks,
  registerCheck,
  registerDoctorModule,
  resetBuiltinDoctorChecksFlag,
  resetDoctorModuleFlags,
  resetDoctorRegistry,
  runDoctor,
  type DoctorExecutedCheck,
} from "./index";

afterEach(() => {
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetBuiltinRegistrationFlag();
  resetDoctorRegistry();
  resetBuiltinDoctorChecksFlag();
  resetDoctorModuleFlags();
  resetModuleRenderers();
});

describe("Doctor Engine", () => {
  it("registers checks independently via registerCheck", () => {
    registerCheck({
      id: "demo.ok",
      name: "Demo",
      capability: "developer",
      severity: "info",
      run: () => ({ status: "pass", message: "ok" }),
    });
    expect(getChecks().map((c) => c.id)).toContain("demo.ok");
  });

  it("computes Health Score with warning half-credit", () => {
    const checks: DoctorExecutedCheck[] = [
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
        capability: "runtime",
        status: "fail",
        message: "",
        recommendations: [],
        durationMs: 1,
      },
      {
        id: "d",
        name: "D",
        capability: "runtime",
        status: "skip",
        message: "",
        recommendations: [],
        durationMs: 1,
      },
    ];
    // earned 1 + 0.5 + 0 / possible 3 → 50%
    expect(computeHealthScore(checks)).toBe(50);
  });

  it("runDoctor executes builtins and groups capabilities", async () => {
    registerBuiltinRuntimeModules();
    registerDoctorModule();
    const report = await runDoctor({ platform: "web" });
    expect(report.version).toBe("1.1.0");
    expect(report.checks.length).toBeGreaterThanOrEqual(
      BUILTIN_DOCTOR_CHECK_IDS.length,
    );
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);
    expect(report.capabilities.some((c) => c.capability === "runtime")).toBe(
      true,
    );
    expect(report.capabilities.some((c) => c.capability === "branding")).toBe(
      true,
    );
    expect(findModule("doctor")).toBeTruthy();
  });

  it("emits FOPEBA evidence on fail/warning only", async () => {
    registerCheck({
      id: "demo.fail",
      name: "Fail me",
      capability: "developer",
      severity: "error",
      run: () => ({
        status: "fail",
        message: "broken",
        recommendations: ["fix it"],
      }),
    });
    registerCheck({
      id: "demo.pass",
      name: "Pass me",
      capability: "developer",
      severity: "info",
      run: () => ({ status: "pass", message: "ok" }),
    });
    const report = await runDoctor({ platform: "web" });
    expect(report.evidences.some((e) => e.source === "doctor:demo.fail")).toBe(
      true,
    );
    expect(report.evidences.some((e) => e.source === "doctor:demo.pass")).toBe(
      false,
    );
    const ev = report.evidences.find((e) => e.source === "doctor:demo.fail");
    const payload = ev?.payload as { check: string; platform: string };
    expect(payload.check).toBe("demo.fail");
    expect(payload.platform).toBe("web");
  });

  it("builtin registration is idempotent", () => {
    registerBuiltinDoctorChecks();
    registerBuiltinDoctorChecks();
    expect(getChecks().length).toBe(BUILTIN_DOCTOR_CHECK_IDS.length);
  });
});
