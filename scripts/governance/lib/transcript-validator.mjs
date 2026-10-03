// @ts-check
import fs from "node:fs";

/**
 * @typedef {Object} TokenMatch
 * @property {string} cr
 * @property {string} gate
 * @property {string} nonce
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
  const multilineRegex =
    /AUTORIZACION_EXPLICITA_HUMANA:\s*\n(?:\s*CR:\s*(\S+)\s*\n)?(?:\s*GATE:\s*(\S+)\s*\n)?(?:\s*NONCE:\s*(\S+))?/i;
  const multiMatch = text.match(multilineRegex);
  if (multiMatch) {
    const lines = text.split("\n");
    let cr = "";
    let gate = "";
    let nonce = "";

    for (const line of lines) {
      const crMatch = line.match(/^\s*CR:\s*(\S+)/i);
      if (crMatch) cr = crMatch[1].trim();
      const gateMatch = line.match(/^\s*GATE:\s*(\S+)/i);
      if (gateMatch) gate = gateMatch[1].trim();
      const nonceMatch = line.match(/^\s*NONCE:\s*(\S+)/i);
      if (nonceMatch) nonce = nonceMatch[1].trim();
    }

    if (cr && gate && nonce) {
      return { cr, gate, nonce };
    }
  }

  // 2. Compact single-line format:
  // AUTORIZO GATE_7 CR-GOV-01 NONCE:9f4a81c2e7b01234
  const compactRegex = /AUTORIZO\s+(\S+)\s+(\S+)\s+NONCE:(\S+)/i;
  const compactMatch = text.match(compactRegex);
  if (compactMatch) {
    return {
      gate: compactMatch[1].trim(),
      cr: compactMatch[2].trim(),
      nonce: compactMatch[3].trim(),
    };
  }

  return null;
}

/**
 * Validates the transcript file against strict governance rules.
 *
 * @param {Object} params
 * @param {string} params.transcriptPath
 * @param {string} params.expectedCr
 * @param {string} params.expectedGate
 * @param {string} params.expectedNonce
 * @returns {{ valid: boolean, reason?: string, stepIndex?: number, timestamp?: string, details?: any }}
 */
export function validateTranscriptAuthorization({
  transcriptPath,
  expectedCr,
  expectedGate,
  expectedNonce,
}) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return {
      valid: false,
      reason: `TRANSCRIPT_NOT_FOUND: Path ${transcriptPath} does not exist.`,
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

      // ALL PROVENANCE AND BINDING CHECKS PASSED (advisory, non-authoritative under CR-GOV-02)
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
      reason: `SYNTHETIC_SIGNAL_REJECTED: Found ${suspiciousAttempts.length} authorization token(s) generated by non-human sources (source: ${suspiciousAttempts[0].source}, type: ${suspiciousAttempts[0].type}). Synthetic signals are strictly rejected.`,
      suspiciousAttempts,
    };
  }

  return {
    valid: false,
    reason: `NO_HUMAN_AUTHORIZATION_FOUND: No valid USER_EXPLICIT token matching CR:${expectedCr} GATE:${expectedGate} found in transcript.`,
  };
}
