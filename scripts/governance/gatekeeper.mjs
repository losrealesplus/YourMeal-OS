#!/usr/bin/env node
// @ts-check
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { lockGate, consumeNonceAtomic, getGatesStatus } from "./lib/nonce-store.mjs";
import {
  validateTranscriptAuthorization,
  computeHmacSignature,
} from "./lib/transcript-validator.mjs";
import { recordAudit, readAuditLog } from "./lib/audit-logger.mjs";
import { loadProductionVault, executeWithVault } from "./lib/credential-vault.mjs";

const DEFAULT_KEY_FILE = path.join(os.homedir(), ".yourmeal-os", "operator.key");

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
 * Resolves operator key from CLI arg, key file, or environment.
 * @param {Object} options
 * @param {string} [options.key]
 * @param {string} [options.keyFile]
 * @returns {string | null}
 */
export function resolveOperatorKey(options) {
  if (options.key && options.key.trim().length > 0) {
    return options.key.trim();
  }

  const keyFilePath = options.keyFile || DEFAULT_KEY_FILE;
  if (fs.existsSync(keyFilePath)) {
    try {
      const raw = fs.readFileSync(keyFilePath, "utf8").trim();
      if (raw.length > 0) return raw;
    } catch {
      // Failed to read key file
    }
  }

  // Fallback to environment variable if explicitly provided
  if (
    process.env.GATEKEEPER_OPERATOR_KEY &&
    process.env.GATEKEEPER_OPERATOR_KEY.trim().length > 0
  ) {
    return process.env.GATEKEEPER_OPERATOR_KEY.trim();
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
    key: "",
    keyFile: "",
    vault: "",
    stateDir: "",
    childCommand: [],
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--") {
      options.childCommand = args.slice(i + 1);
      break;
    } else if (arg === "--cr" && i + 1 < args.length) {
      options.cr = args[++i];
    } else if (arg === "--gate" && i + 1 < args.length) {
      options.gate = args[++i].toUpperCase();
    } else if (arg === "--ttl" && i + 1 < args.length) {
      options.ttl = parseInt(args[++i], 10) || 60;
    } else if (arg === "--transcript" && i + 1 < args.length) {
      options.transcript = args[++i];
    } else if (arg === "--key" && i + 1 < args.length) {
      options.key = args[++i];
    } else if (arg === "--key-file" && i + 1 < args.length) {
      options.keyFile = args[++i];
    } else if (arg === "--vault" && i + 1 < args.length) {
      options.vault = args[++i];
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

  const operatorKey = resolveOperatorKey(options);
  if (!operatorKey) {
    const reason =
      "OPERATOR_KEY_UNAVAILABLE: Human Product Authority key not provided. Set --key, --key-file, or GATEKEEPER_OPERATOR_KEY.";
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

  // 1. Validate transcript entry and HMAC signature
  const transcriptResult = validateTranscriptAuthorization({
    transcriptPath,
    expectedCr: cr,
    expectedGate: gate,
    expectedNonce: activeRecord.nonce,
    operatorKey,
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
      console.log("\nPara autorizar este Gate, la Human Product Authority debe emitir en el chat:");
      console.log("\nAUTORIZACION_EXPLICITA_HUMANA:");
      console.log(`  CR: ${record.cr_id}`);
      console.log(`  GATE: ${record.gate}`);
      console.log(`  NONCE: ${record.nonce}`);
      console.log("  SIGNATURE: <HMAC_SHA256(CR:GATE:NONCE, OPERATOR_SECRET)>");
      console.log("\nO en formato compacto:");
      console.log(
        `AUTORIZO ${record.gate} ${record.cr_id} NONCE:${record.nonce} SIGNATURE:<HMAC_SHA256>`,
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
        `\n✅ [GATEKEEPER PASS] Authorization verified for Gate ${options.gate}. Nonce consumed successfully.`,
      );
      break;
    }

    case "run": {
      if (options.childCommand.length === 0) {
        console.error("Error: No target command specified after --");
        process.exit(1);
      }

      const verifyResult = executeVerification(options);
      if (!verifyResult.pass) {
        console.error(`\n🚨 [GATEKEEPER HARD STOP] Execution BLOCKED for Gate ${options.gate}:`);
        console.error(`Reason: ${verifyResult.reason}\n`);
        process.exit(1);
      }

      console.log(
        `\n✅ [GATEKEEPER PASS] Authorization verified. Injecting credentials from vault...`,
      );

      let credentials = {};
      try {
        credentials = loadProductionVault(options.vault || undefined);
      } catch (vaultErr) {
        console.error(`\n🚨 [GATEKEEPER HARD STOP] Vault loading failed: ${vaultErr.message}\n`);
        recordAudit(
          {
            event: "VAULT_LOAD_FAILED",
            cr_id: options.cr,
            gate: options.gate,
            result: "FAIL",
            reason: vaultErr.message,
          },
          options.stateDir || undefined,
        );
        process.exit(1);
      }

      const cmd = options.childCommand[0];
      const cmdArgs = options.childCommand.slice(1);

      recordAudit(
        {
          event: "COMMAND_SPAWNED",
          cr_id: options.cr,
          gate: options.gate,
          result: "INFO",
          command: options.childCommand.join(" "),
        },
        options.stateDir || undefined,
      );

      try {
        const exitCode = await executeWithVault({
          command: cmd,
          args: cmdArgs,
          credentials,
        });
        process.exit(exitCode);
      } catch (execErr) {
        console.error(`\n🚨 [GATEKEEPER] Command execution error: ${execErr.message}`);
        process.exit(1);
      }
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
        "Usage: gatekeeper <lock|verify|run|status|audit|deny-direct-deploy|deny-direct-migrate> [options]",
      );
      console.log("  lock   --cr <CR> --gate <GATE> [--ttl <MINUTES>]");
      console.log("  verify --cr <CR> --gate <GATE> [--transcript <FILE>] [--key <KEY>]");
      console.log(
        "  run    --cr <CR> --gate <GATE> [--transcript <FILE>] [--key <KEY>] [--vault <FILE>] -- <COMMAND...>",
      );
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
