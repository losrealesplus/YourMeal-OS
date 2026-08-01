import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isInvalidVitePublishableKey,
  readVitePublishableKeyFromEnvFile,
  validateVitePublishableKey,
} from "./ps002c-vite-env.mjs";

describe("ps002c-vite-env", () => {
  it("flags empty and REPLACE_ME keys", () => {
    assert.equal(isInvalidVitePublishableKey(""), true);
    assert.equal(isInvalidVitePublishableKey("   "), true);
    assert.equal(isInvalidVitePublishableKey("sb_publishable_REPLACE_ME"), true);
    assert.equal(
      isInvalidVitePublishableKey('sb_publishable_REPLACE_ME'),
      true,
    );
    assert.equal(
      isInvalidVitePublishableKey("sb_publishable_abc123_test_value"),
      false,
    );
  });

  it("validateVitePublishableKey returns BLOCKED message for placeholder", () => {
    const result = validateVitePublishableKey("sb_publishable_REPLACE_ME");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Invalid VITE_SUPABASE_PUBLISHABLE_KEY/);
      assert.match(result.reason, /REPLACE_ME|placeholder/i);
      assert.match(result.reason, /VITE_SUPABASE_PUBLISHABLE_KEY/);
    }
  });

  it("reads key from .env without exposing other secrets in return", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-vite-env-"));
    try {
      fs.writeFileSync(
        path.join(dir, ".env"),
        [
          'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_test_value"',
          'SUPABASE_PUBLISHABLE_KEY="sb_publishable_other"',
        ].join("\n"),
        "utf8",
      );
      const key = readVitePublishableKeyFromEnvFile(path.join(dir, ".env"));
      assert.equal(key, "sb_publishable_test_value");
      fs.writeFileSync(
        path.join(dir, ".env"),
        "VITE_SUPABASE_PUBLISHABLE_KEY=\n",
        "utf8",
      );
      assert.equal(readVitePublishableKeyFromEnvFile(path.join(dir, ".env")), "");
      fs.writeFileSync(path.join(dir, ".env"), "PS002_EMAIL=x\n", "utf8");
      assert.equal(readVitePublishableKeyFromEnvFile(path.join(dir, ".env")), null);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
