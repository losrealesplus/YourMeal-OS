import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorNode } from "./doctor-node.mjs";

describe("doctor-node", () => {
  it("PASS on current Node runtime with npm", () => {
    const r = runDoctorNode({ env: process.env });
    assert.equal(r.ok, true);
    assert.ok(r.evidence.nodeVersion);
    assert.ok(
      r.checks.find((c) => c.id === "node_version_supported" && c.ok),
    );
  });

  it("records node major in evidence", () => {
    const r = runDoctorNode({});
    assert.equal(typeof r.evidence.nodeMajor, "number");
    assert.ok(/** @type {number} */ (r.evidence.nodeMajor) >= 20);
  });
});
