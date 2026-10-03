import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateBrokerRequest } from "./broker-engine.mjs";
import { createExecutionRequest } from "./propose-execution.mjs";

describe("CR-GOV-02: External Execution Broker Test Suite", () => {
  const validPayload = {
    $schema: "https://yourmealos.com/schemas/broker-request-v1.json",
    request_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    timestamp: new Date().toISOString(),
    cr_id: "CR-OPS-06",
    target_gate: "GATE_7",
    target_environment: "production-worker",
    commit_sha: "e827b089e463e2793ee689d9c35d3433ffa11ce1",
    artifact_digest: "sha256:01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
    proposer: {
      agent_id: "antigravity",
      host_user: "alex",
      git_branch: "feat/cr-gov-02",
    },
    rationale: "Production worker release",
  };

  it("1. C-1 Gate vs Environment Binding: Valid Gate 7 to production-worker passes", () => {
    const res = validateBrokerRequest(validPayload, {
      currentBranch: "main",
    });
    assert.equal(res.valid, true);
    assert.equal(res.targetGate, "GATE_7");
  });

  it("2. C-1 ADVERSARIAL: Cross-Gate Attack (Gate 6 targeting production-worker) fails closed", () => {
    const malformed = {
      ...validPayload,
      target_gate: "GATE_6",
      target_environment: "production-worker", // Gate 6 is DB only!
    };
    assert.throws(
      () => validateBrokerRequest(malformed, { currentBranch: "main" }),
      /SECURITY_VIOLATION \(C-1\)/
    );
  });

  it("3. C-2 ADVERSARIAL: Production execution from non-main branch fails closed", () => {
    assert.throws(
      () => validateBrokerRequest(validPayload, { currentBranch: "feature/unauthorized" }),
      /SECURITY_VIOLATION \(C-2\)/
    );
  });

  it("4. C-3 Cryptographic Digest: Mismatched artifact checksum fails closed", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "broker-test-"));
    const artifactFile = path.join(tmpDir, "bundle.tar.gz");
    fs.writeFileSync(artifactFile, "real-unmodified-content", "utf-8");

    const payloadWithBadDigest = {
      ...validPayload,
      artifact_digest: "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    };

    assert.throws(
      () =>
        validateBrokerRequest(payloadWithBadDigest, {
          currentBranch: "main",
          artifactPath: artifactFile,
        }),
      /SECURITY_VIOLATION \(C-3\): Cryptographic digest mismatch/
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("5. C-6 ADVERSARIAL: Self-Review Attack (Proposer == Approver) fails closed", () => {
    assert.throws(
      () =>
        validateBrokerRequest(validPayload, {
          currentBranch: "main",
          proposerLogin: "antigravity-bot",
          approverLogin: "antigravity-bot", // Attempted self-review
        }),
      /SECURITY_VIOLATION \(C-6\): Self-review detected/
    );
  });

  it("6. C-7 ADVERSARIAL: Replay Attack (Re-submitting consumed request_id) fails closed", () => {
    const consumedNonces = new Set(["a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"]);
    assert.throws(
      () =>
        validateBrokerRequest(validPayload, {
          currentBranch: "main",
          consumedNonces,
        }),
      /SECURITY_VIOLATION \(C-7\): Replay attack detected/
    );
  });

  it("7. Local Proposer Tool generates valid structured payload without credentials", () => {
    const req = createExecutionRequest({
      crId: "CR-OPS-06",
      targetGate: "GATE_5",
      targetEnv: "staging-worker",
    });

    assert.equal(req.cr_id, "CR-OPS-06");
    assert.equal(req.target_gate, "GATE_5");
    assert.equal(req.target_environment, "staging-worker");
    assert.equal(req.proposer.agent_id, "antigravity");
    assert.ok(req.request_id);
    assert.ok(req.timestamp);
  });
});
