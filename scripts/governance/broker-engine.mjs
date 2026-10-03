// @ts-check
import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Validates an incoming execution broker request against security constraints C-1 through C-8.
 *
 * @param {Object} payload The broker execution request payload
 * @param {Object} context Validation runtime context
 * @param {string} context.currentBranch Current git branch in runtime
 * @param {string} [context.artifactPath] Path to artifact file for digest verification
 * @param {string} [context.proposerLogin] GitHub username of proposer
 * @param {string} [context.approverLogin] GitHub username of approver
 * @param {Set<string>} [context.consumedNonces] Set of previously consumed request nonces
 * @returns {{ valid: boolean, targetGate: string, targetEnvironment: string }}
 */
export function validateBrokerRequest(payload, context) {
  if (!payload || typeof payload !== "object") {
    throw new Error("SECURITY_VIOLATION: Payload must be a non-null object");
  }

  // C-1: Gate vs Environment Binding
  const ALLOWED_BINDINGS = {
    GATE_5: ["staging-worker"],
    GATE_6: ["production-db"],
    GATE_7: ["production-worker"],
    GATE_8: ["production-verification"],
  };

  const allowedEnvs = ALLOWED_BINDINGS[payload.target_gate];
  if (!allowedEnvs || !allowedEnvs.includes(payload.target_environment)) {
    throw new Error(
      `SECURITY_VIOLATION (C-1): Invalid Gate vs Environment binding. Gate ${payload.target_gate} cannot target ${payload.target_environment}`
    );
  }

  // C-2: Production Branch Restriction
  const isProduction =
    payload.target_environment === "production-worker" ||
    payload.target_environment === "production-db" ||
    payload.target_environment === "production-verification";

  if (isProduction && context.currentBranch !== "main") {
    throw new Error(
      `SECURITY_VIOLATION (C-2): Production execution only permitted from 'main' branch. Attempted from '${context.currentBranch}'`
    );
  }

  // C-3: Cryptographic Digest Verification
  if (context.artifactPath) {
    if (!fs.existsSync(context.artifactPath)) {
      throw new Error(`SECURITY_VIOLATION (C-3): Artifact file does not exist at ${context.artifactPath}`);
    }
    const buf = fs.readFileSync(context.artifactPath);
    const calculated = "sha256:" + crypto.createHash("sha256").update(buf).digest("hex");
    if (calculated !== payload.artifact_digest) {
      throw new Error(
        `SECURITY_VIOLATION (C-3): Cryptographic digest mismatch. Expected ${payload.artifact_digest}, computed ${calculated}`
      );
    }
  }

  // C-6: Anti-Self-Review Enforcement
  if (context.proposerLogin && context.approverLogin) {
    if (context.proposerLogin.toLowerCase() === context.approverLogin.toLowerCase()) {
      throw new Error(
        `SECURITY_VIOLATION (C-6): Self-review detected. Proposer and approver cannot be the same entity: ${context.proposerLogin}`
      );
    }
  }

  // C-7: Nonce & Replay Prevention
  if (context.consumedNonces && context.consumedNonces.has(payload.request_id)) {
    throw new Error(
      `SECURITY_VIOLATION (C-7): Replay attack detected. Request ID ${payload.request_id} has already been consumed`
    );
  }

  return {
    valid: true,
    targetGate: payload.target_gate,
    targetEnvironment: payload.target_environment,
  };
}
