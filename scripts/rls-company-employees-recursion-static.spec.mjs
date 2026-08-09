import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFixMigrationHygiene,
  assertNoRecursiveCompanyPolicies,
  assertSafePoliciesPreserved,
  runChecks,
  simulateLivePolicies,
} from "./rls-company-employees-recursion-static.mjs";

test("MVP-01.6 fix migration hygiene — drops only, no bypass", () => {
  assertFixMigrationHygiene();
});

test("simulated migrations drop recursive company_employees / companies policies", () => {
  const live = simulateLivePolicies();
  assertNoRecursiveCompanyPolicies(live);
  assert.equal(live.has("company_employees::cemp_read"), false);
  assert.equal(live.has("company_employees::cemp_write"), false);
  assert.equal(live.has("companies::companies_read"), false);
  assert.equal(live.has("companies::companies_write"), false);
});

test("safe staff policies remain after MVP-01.6", () => {
  const live = simulateLivePolicies();
  assertSafePoliciesPreserved(live);
  assert.equal(live.has("company_employees::cemp_all"), true);
  assert.equal(live.has("companies::companies_select_staff"), true);
  assert.equal(live.has("companies::companies_write_staff"), true);
  assert.equal(live.has("companies::companies_insert_staff"), true);
});

test("runChecks aggregates PASS", () => {
  const result = runChecks();
  assert.equal(result.ok, true);
});
