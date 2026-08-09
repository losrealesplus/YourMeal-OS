import test from "node:test";
import assert from "node:assert/strict";
import { assertTenantJoinCodeMigrationContract } from "./tenant-join-code-static.mjs";

test("Phase 2.1 tenant_join_code migration contract", () => {
  assert.doesNotThrow(() => assertTenantJoinCodeMigrationContract());
});
