import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("AdminShell Navigation & Feature Flag Gating", () => {
  it("does not show 'Solo lectura' badge on Cost Intelligence until feature flags are ready", () => {
    const src = readFileSync(resolve(ROOT, "src/components/admin-shell.tsx"), "utf8");

    // Destructures flagsReady
    expect(src).toContain("const { flags: moduleFlags, ready: flagsReady } = usePilotAdminModuleFlags();");

    // Badge is only shown when flagsReady is true and the module flag is disabled
    expect(src).toContain("badge:");
    expect(src).toContain("flagsReady && !moduleFlags[PILOT_ADMIN_MODULE_FLAGS.costIntelligence]");
    expect(src).toContain('? "Solo lectura"');
  });
});
