#!/usr/bin/env node
// @ts-check
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { lockGate, consumeNonceAtomic, getGatesStatus } from "./lib/nonce-store.mjs";
import { validateTranscriptAuthorization } from "./lib/transcript-validator.mjs";
import { recordAudit, readAuditLog } from "./lib/audit-logger.mjs";

/**
 * Discovers the active transcript path if not explicitly provided.
 * @returns {string | null}
 */
export function discoverDefaultTranscript() {
  const baseGemini = path.join(os.homedir(), ".gemini", "antigravity", "brain");
  if (!fs.existsSync(baseGemini)) {
    return null;
  }
  try {
    const convDirs = fs
      .readdirSync(baseGemini)
      .map((d) => ({ name: d, mtime: fs.statSync(path.join(baseGemini, d)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const conv of convDirs) {
      const candidate = path.join(
        baseGemini,
        conv.name,
        ".system_generated",
        "logs",
        "transcript.jsonl",
      );
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // Discovery failed
  }
  return null;
}

/**
 * Parses CLI arguments.
 * @param {string[]} args
 */
export function parseArgs(args) {
  const command = args[0];
  const options = {
    cr: "",
    gate: "",
    ttl: 60,
    transcript: "",
    stateDir: "",
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--cr" && i + 1 < args.length) {
      options.cr = args[++i];
    } else if (arg === "--gate" && i + 1 < args.length) {
      options.gate = args[++i].toUpperCase();
    } else if (arg === "--ttl" && i + 1 < args.length) {
      options.ttl = parseInt(args[++i], 10) || 60;
    } else if (arg === "--transcript" && i + 1 < args.length) {
      options.transcript = args[++i];
    } else if (arg === "--state-dir" && i + 1 < args.length) {
      options.stateDir = args[++i];
    }
    i++;
  }

  return { command, options };
}

/**
 * Executes verification logic and atomically consumes the nonce on success.
 * @param {Object} options
 * @returns {{ pass: boolean, reason?: string, details?: any }}
 */
export function executeVerification(options) {
  const { cr, gate, stateDir } = options;

  if (!cr || !gate) {
    const reason = "MISSING_ARGS: Both --cr and --gate are strictly required.";
    recordAudit(
      { event: "VERIFY_ATTEMPT_REJECTED", cr_id: cr, gate, result: "FAIL", reason },
      stateDir,
    );
    return { pass: false, reason };
  }

  const gatesStatus = getGatesStatus(stateDir);
  const activeRecord = gatesStatus[gate];

  if (!activeRecord) {
    const reason = `GATE_NOT_LOCKED: Gate ${gate} is not locked or has no active nonce.`;
    recordAudit(
      { event: "VERIFY_ATTEMPT_REJECTED", cr_id: cr, gate, result: "FAIL", reason },
      stateDir,
    );
    return { pass: false, reason };
  }

  if (activeRecord.status !== "ACTIVE") {
    const reason = `GATE_STATUS_NOT_ACTIVE: Gate ${gate} status is ${activeRecord.status}. Cannot verify.`;
    recordAudit(
      {
        event: "VERIFY_ATTEMPT_REJECTED",
        cr_id: cr,
        gate,
        nonce_prefix: activeRecord.nonce,
        result: "FAIL",
        reason,
      },
      stateDir,
    );
    return { pass: false, reason };
  }

  const transcriptPath = options.transcript || discoverDefaultTranscript();
  if (!transcriptPath) {
    const reason =
      "TRANSCRIPT_UNRESOLVED: Could not locate active session transcript. Pass --transcript.";
    recordAudit(
      {
        event: "VERIFY_ATTEMPT_REJECTED",
        cr_id: cr,
        gate,
        nonce_prefix: activeRecord.nonce,
        result: "FAIL",
        reason,
      },
      stateDir,
    );
    return { pass: false, reason };
  }

  // 1. Validate transcript entry (provenance + CR/GATE/NONCE match)
  const transcriptResult = validateTranscriptAuthorization({
    transcriptPath,
    expectedCr: cr,
    expectedGate: gate,
    expectedNonce: activeRecord.nonce,
  });

  if (!transcriptResult.valid) {
    recordAudit(
      {
        event: "VERIFY_ATTEMPT_REJECTED",
        cr_id: cr,
        gate,
        nonce_prefix: activeRecord.nonce,
        result: "FAIL",
        reason: transcriptResult.reason,
      },
      stateDir,
    );
    return { pass: false, reason: transcriptResult.reason };
  }

  // 2. ATOMIC CONSUMPTION: Burn nonce with lockfile
  const consumeResult = consumeNonceAtomic({
    crId: cr,
    gate,
    expectedNonce: activeRecord.nonce,
    stateDir,
  });

  if (!consumeResult.success) {
    recordAudit(
      {
        event: "VERIFY_ATTEMPT_REJECTED",
        cr_id: cr,
        gate,
        nonce_prefix: activeRecord.nonce,
        result: "FAIL",
        reason: consumeResult.reason,
      },
      stateDir,
    );
    return { pass: false, reason: consumeResult.reason };
  }

  // SUCCESS! Record audit and return pass
  recordAudit(
    {
      event: "VERIFY_ATTEMPT_SUCCESS",
      cr_id: cr,
      gate,
      nonce_prefix: activeRecord.nonce,
      result: "PASS",
      reason: `Authenticated by Human Product Authority at step ${transcriptResult.stepIndex}`,
    },
    stateDir,
  );

  return { pass: true, details: transcriptResult.details };
}

// CLI Execution entry point
async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "lock": {
      if (!options.cr || !options.gate) {
        console.error("Error: --cr <CR_ID> and --gate <GATE> are required.");
        process.exit(1);
      }
      const record = lockGate({
        crId: options.cr,
        gate: options.gate,
        ttlMinutes: options.ttl,
        stateDir: options.stateDir || undefined,
      });

      recordAudit(
        {
          event: "GATE_LOCKED",
          cr_id: record.cr_id,
          gate: record.gate,
          nonce_prefix: record.nonce,
          result: "INFO",
          reason: `Locked for ${options.ttl}m`,
        },
        options.stateDir || undefined,
      );

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🔒 GATE ${record.gate} IS LOCKED (CR: ${record.cr_id})`);
      console.log(`NONCE: ${record.nonce}`);
      console.log(`EXPIRES AT: ${new Date(record.expires_at).toISOString()}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\nCR-GOV-02: el Gatekeeper local NO autoriza ejecuciones privilegiadas.");
      console.log("La autoridad de produccion reside exclusivamente en GitHub Actions + Environment");
      console.log("protegido (aprobacion humana OOB). Este nonce solo registra la precondicion local.");
      console.log("\nEl token de precondicion local que la Human Product Authority puede emitir en el chat:");
      console.log("\nAUTORIZACION_EXPLICITA_HUMANA:");
      console.log(`  CR: ${record.cr_id}`);
      console.log(`  GATE: ${record.gate}`);
      console.log(`  NONCE: ${record.nonce}`);
      console.log("\nO en formato compacto:");
      console.log(
        `AUTORIZO ${record.gate} ${record.cr_id} NONCE:${record.nonce}`,
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      break;
    }

    case "verify": {
      const result = executeVerification(options);
      if (!result.pass) {
        console.error(`\n🚨 [GATEKEEPER HARD STOP] Verification FAILED for Gate ${options.gate}:`);
        console.error(`Reason: ${result.reason}\n`);
        process.exit(1);
      }
      console.log(
        `\n✅ [GATEKEEPER PASS] Local governance precondition verified for Gate ${options.gate}. Nonce consumed. ADVISORY ONLY: this does not authorize any execution (CR-GOV-02).`,
      );
      break;
    }

    case "status": {
      const status = getGatesStatus(options.stateDir || undefined);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("GATEKEEPER STATUS MATRIX");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      const entries = Object.entries(status);
      if (entries.length === 0) {
        console.log("No gates currently registered.");
      } else {
        for (const [gateName, rec] of entries) {
          console.log(
            `Gate: ${gateName.padEnd(8)} | CR: ${rec.cr_id.padEnd(12)} | Status: ${rec.status.padEnd(8)} | Nonce: ${rec.nonce} | Expires: ${new Date(rec.expires_at).toLocaleTimeString()}`,
          );
        }
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      break;
    }

    case "audit": {
      const entries = readAuditLog(options.stateDir || undefined);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`GATEKEEPER AUDIT LOG (${entries.length} events)`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      for (const e of entries.slice(-20)) {
        console.log(
          `[${e.timestamp}] ${e.event.padEnd(24)} | ${e.gate || "---"} | Result: ${e.result} | Reason: ${e.reason || "OK"}`,
        );
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      break;
    }

    case "deny-direct-deploy": {
      console.error("\n🚨 [CONSTITUTIONAL BLOCK] Direct local deployment is strictly forbidden.");
      console.error("Per CR-GOV-01R, production deployments must execute exclusively via");
      console.error(
        "remote GitHub Actions with Required Reviewer approval (Alexander Hernandez).\n",
      );
      process.exit(1);
    }

    case "deny-direct-migrate": {
      console.error(
        "\n🚨 [CONSTITUTIONAL BLOCK] Direct local database migration against production is forbidden.",
      );
      console.error("Per CR-GOV-01R, production migrations must execute exclusively via");
      console.error(
        "remote GitHub Actions with Required Reviewer approval (Alexander Hernandez).\n",
      );
      process.exit(1);
    }

    default:
      console.log(
        "Usage: gatekeeper <lock|verify|status|audit|deny-direct-deploy|deny-direct-migrate> [options]",
      );
      console.log("  lock   --cr <CR> --gate <GATE> [--ttl <MINUTES>]");
      console.log("  verify --cr <CR> --gate <GATE> [--transcript <FILE>]");
      console.log("  status");
      console.log("  audit");
      process.exit(1);
  }
}

// Only execute main if invoked directly from CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  main().catch((err) => {
    console.error("Fatal Gatekeeper Error:", err);
    process.exit(1);
  });
}
