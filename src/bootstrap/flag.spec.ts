import { afterEach, describe, expect, it, vi } from "vitest";

describe("isBootstrapMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // DIAGNOSTIC SMOKE: flag is hard-forced ON. Restore env-based tests after revert.
  it("smoke force: always true regardless of env", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(true);
  });

  it("smoke force: still true when env is false", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "false");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(true);
  });
});
