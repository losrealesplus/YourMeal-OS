import { afterEach, describe, expect, it, vi } from "vitest";

describe("isBootstrapMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to false when unset", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(false);
  });

  it("enables only when true", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "true");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(true);
  });
});
