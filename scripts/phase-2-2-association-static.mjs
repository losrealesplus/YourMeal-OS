#!/usr/bin/env node
/**
 * Static contract checks for Phase 2.2 cold association RPC.
 * No DB network required.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = fs.readFileSync(
  path.join(
    root,
    "supabase/migrations/20260810143000_request_tenant_association.sql",
  ),
  "utf8",
);
const service = fs.readFileSync(
  path.join(
    root,
    "src/modules/tenant-association/application/tenant-join-code-service.ts",
  ),
  "utf8",
);
const auth = fs.readFileSync(path.join(root, "src/routes/auth.tsx"), "utf8");
const session = fs.readFileSync(
  path.join(
    root,
    "src/bootstrap/pipeline/services/SessionBootstrapService.ts",
  ),
  "utf8",
);

assert.match(migration, /request_tenant_association_by_join_code/);
assert.match(migration, /'pending'::public\.membership_status/);
assert.match(migration, /self_registration/);
// Body must not auto-approve or call ensure_individual_customer (comments may mention both).
const body = migration.split("AS $$")[1]?.split("$$;")[0] ?? "";
assert.doesNotMatch(body, /'approved'::public\.membership_status/);
assert.doesNotMatch(body, /ensure_individual_customer\s*\(/);
assert.match(service, /requestAssociation/);
assert.match(service, /request_tenant_association_by_join_code/);
assert.match(auth, /joinCode/);
assert.match(auth, /requestAssociation/);
assert.match(session, /membershipStatus/);
assert.match(session, /membershipStatus === \"approved\"/);

console.log("phase-2-2-association-static: OK");
