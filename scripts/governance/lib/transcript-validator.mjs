// @ts-check
import fs from "node:fs";
import crypto from "node:crypto";

/**
 * @typedef {Object} TokenMatch
 * @property {string} cr
 * @property {string} gate
 * @property {string} nonce
 * @property {string} signature
 */

/**
 * Extracts authorization tokens from text content.
 * Supports both multi-line YAML-style blocks and single-line compact syntax.
 *
 * @param {string} text
 * @returns {TokenMatch | null}
 */
export function extractAuthorizationToken(text) {
  if (typeof text !== "string") {
    return null;
  }

  // 1. Multi-line canonical block:
  // AUTORIZACION_EXPLICITA_HUMANA:
  //   CR: CR-XXX-YY
  //   GATE: GATE_X
  //   NONCE: abcdef123456
  //   SIGNATURE: 0123456789abcdef...
  const multilineRegex =
    /AUTORIZACION_EXPLICITA_HUMANA:\s*\n(?:\s*CR:\s*(\S+)\s*\n)?(?:\s*GATE:\s*(\S+)\s*\n)?(?:\s*NONCE:\s*(\S+)\s*\n)?(?:\s*SIGNATURE:\s*(\S+))?/i;
  const multiMatch = text.match(multilineRegex);
  if (multiMatch) {
    const lines = text.split("\n");
    let cr = "";
    let gate = "";
    let nonce = "";
    let signature = "";

    for (const line of lines) {
      const crMatch = line.match(/^\s*CR:\s*(\S+)/i);
      if (crMatch) cr = crMatch[1].trim();
      const gateMatch = line.match(/^\s*GATE:\s*(\S+)/i);
      if (gateMatch) gate = gateMatch[1].trim();
      const nonceMatch = line.match(/^\s*NONCE:\s*(\S+)/i);
      if (nonceMatch) nonce = nonceMatch[1].trim();
      const sigMatch = line.match(/^\s*SIGNATURE:\s*(\S+)/i);
      if (sigMatch) signature = sigMatch[1].trim();
    }

    if (cr && gate && nonce && signature) {
      return { cr, gate, nonce, signature };
    }
  }

  // 2. Compact single-line format:
  // AUTORIZO GATE_7 CR-GOV-01 NONCE:9f4a81c2e7b01234 SIGNATURE:a1b2c3d4e5...
  const compactRegex = /AUTORIZO\s+(\S+)\s+(\S+)\s+NONCE:(\S+)\s+SIGNATURE:(\S+)/i;
  const compactMatch = text.match(compactRegex);
  if (compactMatch) {
    return {
      gate: compactMatch[1].trim(),
      cr: compactMatch[2].trim(),
      nonce: compactMatch[3].trim(),
      signature: compactMatch[4].trim(),
    };
  }

  return null;
}

/**
 * Computes canonical HMAC-SHA256 signature for a given (cr, gate, nonce) tuple.
 * @param {string} cr
 * @param {string} gate
 * @param {string} nonce
 * @param {string | Buffer} operatorKey
 * @returns {string} hex digest
 */
export function computeHmacSignature(cr, gate, nonce, operatorKey) {
  const payload = `${cr}:${gate}:${nonce}`;
  return crypto.createHmac("sha256", operatorKey).update(payload).digest("hex");
}

/**
 * Validates a signature against the computed HMAC using timing-safe comparison.
 * @param {string} providedSig
 * @param {string} expectedSig
 * @returns {boolean}
 */
export function timingSafeCompare(providedSig, expectedSig) {
  if (typeof providedSig !== "string" || typeof expectedSig !== "string") {
    return false;
  }
  const bufProvided = Buffer.from(providedSig.toLowerCase(), "utf8");
  const bufExpected = Buffer.from(expectedSig.toLowerCase(), "utf8");
  if (bufProvided.length !== bufExpected.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufProvided, bufExpected);
}

/**
 * Validates the transcript file against strict governance rules.
 *
 * @param {Object} params
 * @param {string} params.transcriptPath
 * @param {string} params.expectedCr
 * @param {string} params.expectedGate
 * @param {string} params.expectedNonce
 * @param {string | Buffer} params.operatorKey
 * @returns {{ valid: boolean, reason?: string, stepIndex?: number, timestamp?: string, details?: any }}
 */
export function validateTranscriptAuthorization({
  transcriptPath,
  expectedCr,
  expectedGate,
  expectedNonce,
  operatorKey,
}) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return {
      valid: false,
      reason: `TRANSCRIPT_NOT_FOUND: Path ${transcriptPath} does not exist.`,
    };
  }

  if (!operatorKey || (typeof operatorKey === "string" && operatorKey.trim().length === 0)) {
    return {
      valid: false,
      reason: `OPERATOR_KEY_MISSING: Cannot verify authorization without the Human Product Authority operator secret.`,
    };
  }

  let lines;
  try {
    const rawContent = fs.readFileSync(transcriptPath, "utf8");
    lines = rawContent.split("\n").filter((l) => l.trim().length > 0);
  } catch (readErr) {
    return {
      valid: false,
      reason: `TRANSCRIPT_UNREADABLE: ${readErr.message}`,
    };
  }

  if (lines.length === 0) {
    return {
      valid: false,
      reason: `TRANSCRIPT_EMPTY: Transcript file is empty.`,
    };
  }

  const suspiciousAttempts = [];

  // Traverse in reverse (most recent message first)
  for (let i = lines.length - 1; i >= 0; i--) {
    let record;
    try {
      record = JSON.parse(lines[i]);
    } catch {
      // Corrupt line encountered
      continue;
    }

    const content = record.content || "";
    const token = extractAuthorizationToken(content);

    if (token) {
      // We found an authorization token candidate!
      // Check 1: Provenance / Source verification
      const isUserExplicit = record.source === "USER_EXPLICIT";
      const isUserInput = record.type === "USER_INPUT";

      if (!isUserExplicit || !isUserInput) {
        // SYNTHETIC ATTEMPT DETECTED!
        // A hook, tool output, system message, or model produced a token pattern.
        suspiciousAttempts.push({
          step_index: record.step_index,
          source: record.source,
          type: record.type,
          token,
        });
        continue; // Do NOT accept this message
      }

      // Check 2: CR matching
      if (token.cr !== expectedCr) {
        return {
          valid: false,
          reason: `CR_MISMATCH: Token specifies CR ${token.cr}, but expected ${expectedCr}.`,
        };
      }

      // Check 3: Gate matching
      if (token.gate.toUpperCase() !== expectedGate.toUpperCase()) {
        return {
          valid: false,
          reason: `GATE_MISMATCH: Token specifies Gate ${token.gate}, but expected ${expectedGate}.`,
        };
      }

      // Check 4: Nonce matching
      if (token.nonce !== expectedNonce) {
        return {
          valid: false,
          reason: `NONCE_MISMATCH: Token provides nonce ${token.nonce}, but active lock nonce is ${expectedNonce}.`,
        };
      }

      // Check 5: HMAC signature verification
      const expectedSig = computeHmacSignature(token.cr, token.gate, token.nonce, operatorKey);
      if (!timingSafeCompare(token.signature, expectedSig)) {
        return {
          valid: false,
          reason: `HMAC_SIGNATURE_INVALID: Provided signature does not match operator key for ${token.cr}:${token.gate}:${token.nonce}.`,
        };
      }

      // ALL FIVE CONSTITUTIONAL CHECKS PASSED DETERMINISTICALLY!
      return {
        valid: true,
        stepIndex: record.step_index,
        timestamp: record.created_at,
        details: {
          cr: token.cr,
          gate: token.gate,
          nonce: token.nonce,
          source: record.source,
          type: record.type,
        },
      };
    }
  }

  if (suspiciousAttempts.length > 0) {
    return {
      valid: false,
      reason: `SYNTHETIC_SIGNAL_REJECTED: Found ${suspiciousAttempts.length} authorization token(s) generated by non-human sources (source: ${suspiciousAttempts[0].source}, type: ${suspiciousAttempts[0].type}). Per CR-GOV-01, synthetic signals are strictly rejected.`,
      suspiciousAttempts,
    };
  }

  return {
    valid: false,
    reason: `NO_HUMAN_AUTHORIZATION_FOUND: No valid USER_EXPLICIT token matching CR:${expectedCr} GATE:${expectedGate} found in transcript.`,
  };
}
