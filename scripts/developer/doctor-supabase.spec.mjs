import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorSupabase } from "./doctor-supabase.mjs";
import { makeTempRepo, writeMinimalPlatformFixture, writeFiles } from "./test-fixtures.mjs";

describe("doctor-supabase", () => {
  it("PASS when .env.example documents VITE_SUPABASE_*", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    const r = runDoctorSupabase({ cwd, env: {} });
    assert.equal(r.ok, true);
  });

  it("FAIL when .env.example missing required keys", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    writeFiles(cwd, { ".env.example": "FOO=1\n" });
    const r = runDoctorSupabase({ cwd, env: {} });
    assert.equal(r.ok, false);
  });
});
