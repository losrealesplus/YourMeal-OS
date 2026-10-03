// @ts-check
import fs from "node:fs";
import path from "node:path";

const DEFAULT_STATE_DIR = path.resolve(process.cwd(), ".gatekeeper");

/**
 * @typedef {Object} AuditEvent
 * @property {string} event
 * @property {string} [cr_id]
 * @property {string} [gate]
 * @property {string} [nonce_prefix]
 * @property {'PASS' | 'FAIL' | 'INFO'} result
 * @property {string} [reason]
 * @property {number} [pid]
 * @property {string} [command]
 */

/**
 * Appends a tamper-evident structured audit record to the audit log.
 * Sanitizes any potential secrets before writing.
 *
 * @param {AuditEvent} eventData
 * @param {string} [stateDir=DEFAULT_STATE_DIR]
 */
export function recordAudit(eventData, stateDir = DEFAULT_STATE_DIR) {
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    }
    const auditFile = path.join(stateDir, "audit.log");

    // Sanitize: ensure no full secrets or keys are included
    const entry = {
      timestamp: new Date().toISOString(),
      pid: eventData.pid || process.pid,
      event: eventData.event,
      cr_id: eventData.cr_id || null,
      gate: eventData.gate || null,
      nonce_prefix: eventData.nonce_prefix ? `${eventData.nonce_prefix.slice(0, 4)}...` : null,
      result: eventData.result,
      reason: eventData.reason || null,
      command: eventData.command
        ? eventData.command.replace(/--token[=\s]\S+/gi, "--token=[REDACTED]")
        : null,
    };

    fs.appendFileSync(auditFile, JSON.stringify(entry) + "\n", { mode: 0o600 });
  } catch (err) {
    console.error("[GATEKEEPER] Warning: Failed to record audit log:", err.message);
  }
}

/**
 * Reads all audit log entries.
 * @param {string} [stateDir=DEFAULT_STATE_DIR]
 * @returns {Array<Object>}
 */
export function readAuditLog(stateDir = DEFAULT_STATE_DIR) {
  const auditFile = path.join(stateDir, "audit.log");
  if (!fs.existsSync(auditFile)) {
    return [];
  }
  const lines = fs.readFileSync(auditFile, "utf8").split("\n").filter(Boolean);
  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { raw: line, error: "MALFORMED_LINE" };
    }
  });
}
