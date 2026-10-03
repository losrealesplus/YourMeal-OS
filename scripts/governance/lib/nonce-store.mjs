// @ts-check
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * @typedef {Object} NonceRecord
 * @property {string} cr_id
 * @property {string} gate
 * @property {string} nonce
 * @property {number} issued_at
 * @property {number} expires_at
 * @property {'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED'} status
 * @property {number | null} consumed_at
 * @property {number | null} consumed_by_pid
 */

/**
 * @typedef {Object} GatekeeperState
 * @property {number} schema_version
 * @property {Record<string, NonceRecord>} gates
 * @property {Array<NonceRecord>} history
 */

const DEFAULT_STATE_DIR = path.resolve(process.cwd(), ".gatekeeper");
const LOCK_TIMEOUT_MS = 5000;
const LOCK_RETRY_INTERVAL_MS = 25;

/**
 * Generates an 8-byte cryptographically secure hex nonce.
 * @returns {string}
 */
export function generateNonce() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Ensures the target state directory exists with secure permissions.
 * @param {string} stateDir
 */
export function ensureStateDir(stateDir = DEFAULT_STATE_DIR) {
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Executes a callback holding an exclusive atomic filesystem lock.
 * Prevents race conditions between concurrent processes attempting to verify/consume nonces.
 *
 * @template T
 * @param {string} stateDir
 * @param {(stateFile: string) => T} callback
 * @returns {T}
 */
export function withAtomicLock(stateDir, callback) {
  ensureStateDir(stateDir);
  const lockFile = path.join(stateDir, ".lock");
  const stateFile = path.join(stateDir, "state.json");
  const startTime = Date.now();

  let lockFd = null;
  while (lockFd === null) {
    try {
      // 'wx' flag fails if lockFile already exists (atomic creation)
      lockFd = fs.openSync(lockFile, "wx");
    } catch (err) {
      if (err.code === "EEXIST") {
        if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
          // Check for stale lock (older than 10s)
          try {
            const stats = fs.statSync(lockFile);
            if (Date.now() - stats.mtimeMs > 10000) {
              fs.unlinkSync(lockFile);
              continue;
            }
          } catch {
            // Lock might have been released in between
            continue;
          }
          throw new Error(
            `[GATEKEEPER] Atomic lock timeout after ${LOCK_TIMEOUT_MS}ms. Concurrency conflict.`,
          );
        }
        // Busy wait with sleep
        const waitTill = Date.now() + LOCK_RETRY_INTERVAL_MS;
        while (Date.now() < waitTill) {
          // spin
        }
      } else {
        throw err;
      }
    }
  }

  try {
    return callback(stateFile);
  } finally {
    try {
      if (lockFd !== null) {
        fs.closeSync(lockFd);
      }
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    } catch (cleanupErr) {
      console.error("[GATEKEEPER] Warning: Failed to clean up lockfile:", cleanupErr);
    }
  }
}

/**
 * Loads the gatekeeper state from disk.
 * @param {string} stateFile
 * @returns {GatekeeperState}
 */
export function loadState(stateFile) {
  if (!fs.existsSync(stateFile)) {
    return {
      schema_version: 1,
      gates: {},
      history: [],
    };
  }
  try {
    const raw = fs.readFileSync(stateFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`[GATEKEEPER] State file corrupted or unreadable: ${err.message}`);
  }
}

/**
 * Saves state atomically via temp file rename.
 * @param {string} stateFile
 * @param {GatekeeperState} state
 */
export function saveStateAtomic(stateFile, state) {
  const tmpFile = `${stateFile}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(tmpFile, stateFile);
}

/**
 * Locks a Gate and issues a new single-use ephemeral Nonce.
 *
 * @param {Object} params
 * @param {string} params.crId
 * @param {string} params.gate
 * @param {number} [params.ttlMinutes=60]
 * @param {string} [params.stateDir=DEFAULT_STATE_DIR]
 * @returns {NonceRecord}
 */
export function lockGate({ crId, gate, ttlMinutes = 60, stateDir = DEFAULT_STATE_DIR }) {
  if (!crId || !gate) {
    throw new Error("[GATEKEEPER] crId and gate are required to lock a gate");
  }

  return withAtomicLock(stateDir, (stateFile) => {
    const state = loadState(stateFile);
    const existing = state.gates[gate];

    // If an existing nonce is still active, archive it as REVOKED
    if (existing && existing.status === "ACTIVE") {
      existing.status = "REVOKED";
      state.history.push({ ...existing });
    }

    const now = Date.now();
    /** @type {NonceRecord} */
    const newRecord = {
      cr_id: crId,
      gate,
      nonce: generateNonce(),
      issued_at: now,
      expires_at: now + ttlMinutes * 60 * 1000,
      status: "ACTIVE",
      consumed_at: null,
      consumed_by_pid: null,
    };

    state.gates[gate] = newRecord;
    saveStateAtomic(stateFile, state);
    return newRecord;
  });
}

/**
 * Atomically verifies and burns a single-use Nonce.
 * Guarantees that even under concurrent race conditions, exactly one consumer succeeds.
 *
 * @param {Object} params
 * @param {string} params.crId
 * @param {string} params.gate
 * @param {string} params.expectedNonce
 * @param {string} [params.stateDir=DEFAULT_STATE_DIR]
 * @returns {{ success: boolean, reason?: string, record?: NonceRecord }}
 */
export function consumeNonceAtomic({ crId, gate, expectedNonce, stateDir = DEFAULT_STATE_DIR }) {
  return withAtomicLock(stateDir, (stateFile) => {
    const state = loadState(stateFile);
    const record = state.gates[gate];

    if (!record) {
      return { success: false, reason: `GATE_NOT_LOCKED: No active lock found for gate ${gate}` };
    }

    if (record.cr_id !== crId) {
      return {
        success: false,
        reason: `CR_MISMATCH: Lock belongs to ${record.cr_id}, expected ${crId}`,
      };
    }

    if (record.gate !== gate) {
      return {
        success: false,
        reason: `GATE_MISMATCH: Lock is for ${record.gate}, expected ${gate}`,
      };
    }

    if (record.status === "CONSUMED") {
      return {
        success: false,
        reason: `NONCE_ALREADY_CONSUMED: Nonce was already consumed at ${new Date(record.consumed_at || 0).toISOString()}`,
      };
    }

    if (record.status !== "ACTIVE") {
      return { success: false, reason: `NONCE_NOT_ACTIVE: Status is ${record.status}` };
    }

    const now = Date.now();
    if (now > record.expires_at) {
      record.status = "EXPIRED";
      saveStateAtomic(stateFile, state);
      return {
        success: false,
        reason: `NONCE_EXPIRED: Nonce expired at ${new Date(record.expires_at).toISOString()}`,
      };
    }

    // Timing-safe comparison of the nonce
    const bufExpected = Buffer.from(expectedNonce, "utf8");
    const bufActual = Buffer.from(record.nonce, "utf8");
    if (
      bufExpected.length !== bufActual.length ||
      !crypto.timingSafeEqual(bufExpected, bufActual)
    ) {
      return {
        success: false,
        reason: `NONCE_MISMATCH: Provided nonce does not match active lock`,
      };
    }

    // ATOMIC CONSUMPTION: burn the nonce immediately
    record.status = "CONSUMED";
    record.consumed_at = now;
    record.consumed_by_pid = process.pid;

    state.history.push({ ...record });
    saveStateAtomic(stateFile, state);

    return { success: true, record: { ...record } };
  });
}

/**
 * Returns current status of all gates without mutating state.
 * @param {string} [stateDir=DEFAULT_STATE_DIR]
 * @returns {Record<string, NonceRecord>}
 */
export function getGatesStatus(stateDir = DEFAULT_STATE_DIR) {
  const stateFile = path.join(stateDir, "state.json");
  if (!fs.existsSync(stateFile)) {
    return {};
  }
  const state = loadState(stateFile);
  const now = Date.now();
  // Mark expired on view
  for (const record of Object.values(state.gates)) {
    if (record.status === "ACTIVE" && now > record.expires_at) {
      record.status = "EXPIRED";
    }
  }
  return state.gates;
}
