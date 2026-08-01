/**
 * Node test for bootstrap config loader (run via: node --test scripts/lib/platform-owners-config.spec.mjs)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DEFAULT_PLATFORM_OWNERS_CONFIG_PATH,
  loadPlatformOwnersConfig,
} from "./platform-owners-config.mjs";

describe("loadPlatformOwnersConfig", () => {
  it("loads the repo bootstrap config with current Platform Owners", () => {
    const cfg = loadPlatformOwnersConfig(DEFAULT_PLATFORM_OWNERS_CONFIG_PATH);
    assert.equal(cfg.version, 1);
    assert.equal(cfg.defaultTenantSlug, "eatclean-tenerife");
    assert.ok(cfg.owners.length >= 1);
    assert.ok(cfg.owners.every((o) => o.email.includes("@")));
    assert.ok(
      cfg.owners.some((o) => o.email === "alex1409h@gmail.com"),
      "bootstrap config should include the current Platform Owner emails",
    );
    assert.ok(
      cfg.owners.some((o) => o.email === "alex.hdez.mtinez@gmail.com"),
      "bootstrap config should include the current Platform Owner emails",
    );
    assert.ok(
      !cfg.owners.some((o) => o.email === "alexhdezmtinez@gmail.com"),
      "typo email without dots must not remain in bootstrap config",
    );
  });

  it("normalizes emails and applies defaultTenantSlug", () => {
    const dir = mkdtempSync(join(tmpdir(), "po-cfg-"));
    const path = join(dir, "platform-owners.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        defaultTenantSlug: "eatclean-tenerife",
        owners: [{ email: "  New.Owner@Example.com ", fullName: "New Owner" }],
      }),
    );
    try {
      const cfg = loadPlatformOwnersConfig(path);
      assert.equal(cfg.owners[0].email, "new.owner@example.com");
      assert.equal(cfg.owners[0].tenantSlug, "eatclean-tenerife");
      assert.equal(cfg.owners[0].fullName, "New Owner");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects duplicate emails", () => {
    const dir = mkdtempSync(join(tmpdir(), "po-cfg-"));
    const path = join(dir, "platform-owners.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        defaultTenantSlug: "eatclean-tenerife",
        owners: [
          { email: "a@example.com" },
          { email: "A@example.com" },
        ],
      }),
    );
    try {
      assert.throws(() => loadPlatformOwnersConfig(path), /Duplicate/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
