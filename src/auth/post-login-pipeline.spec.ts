import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  __resetPostLoginPipelineForTests,
  beginPostLoginPipeline,
  canonicalUserIdFromAuthData,
  emitCanonicalReady,
  formatPipelineComparisonTable,
  getObservedPipelineSteps,
  hasCanonicalSession,
  logPostLoginStep,
  PS002_CANONICAL_STEPS,
  validateCanonicalPipeline,
} from "./post-login-pipeline";
import type { Session, User } from "@supabase/supabase-js";

describe("FCR-008 canonical post-login session", () => {
  const user = { id: "user-1" } as User;
  const session = { user } as Session;

  beforeEach(() => {
    __resetPostLoginPipelineForTests();
  });

  it("prefers session.user.id", () => {
    expect(
      canonicalUserIdFromAuthData({
        session,
        user: { id: "other" } as User,
      }),
    ).toBe("user-1");
  });

  it("falls back to data.user.id when session missing", () => {
    expect(canonicalUserIdFromAuthData({ session: null, user })).toBe("user-1");
  });

  it("returns null when neither present", () => {
    expect(canonicalUserIdFromAuthData({ session: null, user: null })).toBe(
      null,
    );
    expect(canonicalUserIdFromAuthData(null)).toBe(null);
  });

  it("hasCanonicalSession requires session.user", () => {
    expect(hasCanonicalSession({ session, user })).toBe(true);
    expect(hasCanonicalSession({ session: null, user })).toBe(false);
  });

  it("logPostLoginStep is callable", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logPostLoginStep("LOGIN_OK", { route: "/auth" });
    expect(spy).toHaveBeenCalledWith(
      "[FCR-008]",
      "LOGIN_OK",
      expect.objectContaining({ route: "/auth" }),
    );
    spy.mockRestore();
  });

  it("HOME_PATH aliases to HOME_PATH_RESOLVED", () => {
    beginPostLoginPipeline("canonical");
    logPostLoginStep("HOME_PATH", { path: "/admin" });
    expect(getObservedPipelineSteps()).toContain("HOME_PATH_RESOLVED");
  });
});

describe("PS-002 canonical pipeline validation", () => {
  beforeEach(() => {
    __resetPostLoginPipelineForTests();
  });

  it("defines the full ordered contract", () => {
    expect(PS002_CANONICAL_STEPS).toEqual([
      "LOGIN",
      "LOGIN_OK",
      "CANONICAL_SESSION",
      "BOOTSTRAP_START",
      "IDENTITY_READY",
      "PROFILE_READY",
      "MEMBERSHIP_READY",
      "ROLE_READY",
      "HOME_PATH_RESOLVED",
      "NAVIGATE",
      "DASHBOARD_RENDERED",
    ]);
  });

  it("PASS when every step occurs exactly once in order", () => {
    const result = validateCanonicalPipeline([...PS002_CANONICAL_STEPS]);
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.duplicates).toEqual([]);
    expect(result.table.every((r) => r.observed)).toBe(true);
  });

  it("FAIL with first missing step when pipeline stops early", () => {
    const partial = [
      "LOGIN",
      "LOGIN_OK",
      "CANONICAL_SESSION",
      "BOOTSTRAP_START",
    ];
    const result = validateCanonicalPipeline(partial);
    expect(result.ok).toBe(false);
    expect(result.firstFailure).toBe("IDENTITY_READY");
    expect(result.table.find((r) => r.step === "IDENTITY_READY")?.observed).toBe(
      false,
    );
    expect(formatPipelineComparisonTable(result)).toContain("IDENTITY_READY");
  });

  it("FAIL on duplicates (no loops)", () => {
    const withDup = [
      ...PS002_CANONICAL_STEPS.slice(0, 4),
      "BOOTSTRAP_START",
      ...PS002_CANONICAL_STEPS.slice(4),
    ];
    const result = validateCanonicalPipeline(withDup);
    expect(result.ok).toBe(false);
    expect(result.duplicates).toContain("BOOTSTRAP_START");
  });

  it("beginPostLoginPipeline emits LOGIN once; emitCanonicalReady only when active", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    emitCanonicalReady("IDENTITY_READY", { userId: "x" });
    expect(getObservedPipelineSteps()).toEqual([]);

    beginPostLoginPipeline("canonical", { route: "/auth/admin" });
    logPostLoginStep("LOGIN_OK");
    emitCanonicalReady("IDENTITY_READY", { userId: "x" });
    const observed = getObservedPipelineSteps();
    expect(observed.filter((s) => s === "LOGIN")).toHaveLength(1);
    expect(observed).toContain("IDENTITY_READY");
    spy.mockRestore();
  });
});
