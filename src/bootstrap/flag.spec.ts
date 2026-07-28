import { afterEach, describe, expect, it, vi } from "vitest";

describe("isBootstrapMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is off by default", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(false);
  });

  it("is off when env is false", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "false");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(false);
  });

  it("is on when env is true", async () => {
    vi.stubEnv("VITE_BOOTSTRAP_MODE", "true");
    const { isBootstrapMode } = await import("./flag");
    expect(isBootstrapMode()).toBe(true);
  });
});
