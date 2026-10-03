#!/usr/bin/env node
// @ts-check
import crypto from "node:crypto";
import fs from "node:fs";
import { execSync } from "node:child_process";

/**
 * Local Proposer Tool (Level 3 - Proposer Only)
 * Constructs an immutable Execution Request Payload without possessing execution privileges.
 */
export function createExecutionRequest({ crId, targetGate, targetEnv, artifactPath }) {
  if (!crId || !targetGate || !targetEnv) {
    throw new Error("Missing required parameters: crId, targetGate, targetEnv");
  }

  let commitSha = "0000000000000000000000000000000000000000";
  let gitBranch = "unknown";
  try {
    commitSha = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // Fallback if not inside git
  }

  let artifactDigest = "sha256:" + "0".repeat(64);
  if (artifactPath && fs.existsSync(artifactPath)) {
    const buf = fs.readFileSync(artifactPath);
    artifactDigest = "sha256:" + crypto.createHash("sha256").update(buf).digest("hex");
  }

  const payload = {
    $schema: "https://yourmealos.com/schemas/broker-request-v1.json",
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    cr_id: crId,
    target_gate: targetGate,
    target_environment: targetEnv,
    commit_sha: commitSha,
    artifact_digest: artifactDigest,
    proposer: {
      agent_id: "antigravity",
      host_user: process.env.USER || "unknown",
      git_branch: gitBranch,
    },
    rationale: `Proposing execution for ${crId} gate ${targetGate}`,
  };

  return payload;
}

export async function main() {
  const args = process.argv.slice(2);
  const crIdx = args.indexOf("--cr");
  const gateIdx = args.indexOf("--gate");
  const envIdx = args.indexOf("--env");
  const artifactIdx = args.indexOf("--artifact");
  const outIdx = args.indexOf("--out");

  if (crIdx === -1 || gateIdx === -1 || envIdx === -1) {
    console.log("Usage: node propose-execution.mjs --cr <CR_ID> --gate <GATE> --env <ENV> [--artifact <FILE>] [--out <FILE>]");
    process.exit(1);
  }

  const crId = args[crIdx + 1];
  const targetGate = args[gateIdx + 1];
  const targetEnv = args[envIdx + 1];
  const artifactPath = artifactIdx !== -1 ? args[artifactIdx + 1] : undefined;
  const outPath = outIdx !== -1 ? args[outIdx + 1] : undefined;

  const payload = createExecutionRequest({ crId, targetGate, targetEnv, artifactPath });

  const jsonStr = JSON.stringify(payload, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, jsonStr, "utf-8");
    console.log(`✅ [PROPOSER] Request payload written to ${outPath}`);
  } else {
    console.log(jsonStr);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  main();
}
