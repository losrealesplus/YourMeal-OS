import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runDoctorAssets } from "./doctor-assets.mjs";
import { makeTempRepo, writeMinimalPlatformFixture, writeFiles } from "./test-fixtures.mjs";

describe("doctor-assets", () => {
  it("PASS when local logo and clean TenantLogo exist", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    const r = runDoctorAssets({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL when Lovable .asset.json is present", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    writeFiles(cwd, {
      "src/assets/eatclean-logo.png.asset.json": '{"url":"/__l5e/x"}\n',
    });
    const r = runDoctorAssets({ cwd });
    assert.equal(r.ok, false);
    assert.ok(
      r.checks.some((c) => c.id === "no_lovable_logo_asset_json" && !c.ok),
    );
  });

  it("FAIL on TenantLogo conflict markers", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    fs.writeFileSync(
      path.join(cwd, "src/components/tenant/tenant-logo.tsx"),
      "<<<<<<< HEAD\nimport fallbackLogoUrl from \"@/tenant/resources/logo.png\";\n=======\nx\n>>>>>>>\n",
    );
    const r = runDoctorAssets({ cwd });
    assert.equal(r.ok, false);
  });
});
