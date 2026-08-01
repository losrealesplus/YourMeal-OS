import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthSession002Trace } from "./auth-session-002-trace";

describe("AUTH-SESSION-002 cold trace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records start/end durations for timed steps", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const trace = createAuthSession002Trace({ route: "/auth/admin" });

    const value = await trace.time("getSession", async () => "ok");
    expect(value).toBe("ok");

    const snap = trace.getSnapshot();
    expect(snap.lastCompleted).toBe("getSession");
    expect(snap.pending).toBeNull();
    expect(typeof snap.durationsMs.getSession).toBe("number");
    expect(info.mock.calls.some((c) => c[0] === "[AUTH-SESSION-002]" && c[1] === "START")).toBe(
      true,
    );
    expect(info.mock.calls.some((c) => c[0] === "[AUTH-SESSION-002]" && c[1] === "END")).toBe(
      true,
    );
  });

  it("keeps pending until await settles (hang simulation via defer)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const trace = createAuthSession002Trace();
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    const running = trace.time("ensurePlatformOwnerSession", async () => {
      await gate;
      return null;
    });

    expect(trace.getSnapshot().pending).toBe("ensurePlatformOwnerSession");
    expect(trace.getSnapshot().lastCompleted).toBeNull();

    release();
    await running;
    expect(trace.getSnapshot().pending).toBeNull();
    expect(trace.getSnapshot().lastCompleted).toBe("ensurePlatformOwnerSession");
  });

  it("records SKIP and SUMMARY without changing thrown errors", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const trace = createAuthSession002Trace();
    trace.skip("loadRoles", "no_session");
    await expect(
      trace.time("getSession", async () => {
        throw new Error("session boom");
      }),
    ).rejects.toThrow("session boom");

    trace.summary({ cancelled: false });
    const summaryCall = info.mock.calls.find(
      (c) => c[0] === "[AUTH-SESSION-002]" && c[1] === "SUMMARY",
    );
    expect(summaryCall?.[2]).toMatchObject({
      lastCompleted: "getSession",
      pending: null,
    });
  });
});
