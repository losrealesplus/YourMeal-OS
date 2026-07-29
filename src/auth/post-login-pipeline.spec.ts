import { describe, expect, it, vi } from "vitest";
import {
  canonicalUserIdFromAuthData,
  hasCanonicalSession,
  logPostLoginStep,
} from "./post-login-pipeline";
import type { Session, User } from "@supabase/supabase-js";

describe("FCR-008 canonical post-login session", () => {
  const user = { id: "user-1" } as User;
  const session = { user } as Session;

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
    expect(spy).toHaveBeenCalledWith("[FCR-008]", "LOGIN_OK", { route: "/auth" });
    spy.mockRestore();
  });
});
