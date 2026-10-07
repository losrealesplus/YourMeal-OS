import { createPublicKey, verify } from "node:crypto";
import {
  closed,
  demand,
  digest,
  fresh,
  intentDigest,
  jcs,
  sha,
  strictJson,
  unb64,
} from "./contract.mjs";
export function registryRecord(x) {
  closed(x, [
    "version",
    "principal",
    "credentialId",
    "keyJwk",
    "rpId",
    "origin",
    "enrollmentEpoch",
  ]);
  demand(
    x.version === "TEST_REGISTRY_V1" &&
      x.principal === "TEST_ALEXANDER" &&
      x.rpId === "localhost" &&
      x.origin === "http://localhost:8787" &&
      x.enrollmentEpoch === 1,
    "TEST_REGISTRY_ONLY",
  );
  demand(unb64(x.credentialId).length === 32, "CREDENTIAL_INVALID");
  closed(x.keyJwk, ["kty", "crv", "x", "y"]);
  demand(
    x.keyJwk.kty === "EC" &&
      x.keyJwk.crv === "P-256" &&
      unb64(x.keyJwk.x).length === 32 &&
      unb64(x.keyJwk.y).length === 32,
    "PUBLIC_KEY_INVALID",
  );
  return createPublicKey({ key: x.keyJwk, format: "jwk" });
}
export function contextFor(intent, registry, sessionId, challengeNonce, now) {
  registryRecord(registry);
  fresh(intent, now);
  return {
    version: "TEST_CHALLENGE_V1",
    intentDigest: intentDigest(intent),
    requestNonce: intent.requestNonce,
    authorizationId: intentDigest(intent),
    sessionId,
    challengeNonce,
    principal: registry.principal,
    rpId: registry.rpId,
    origin: registry.origin,
    enrollmentEpoch: registry.enrollmentEpoch,
    registrySha256: digest("TEST/registry/v1", registry),
    workerImageDigest: intent.workerImageDigest,
    issuedAt: intent.issuedAt,
    expiresAt: intent.expiresAt,
    challengeIssuedAt: now,
    challengeExpiresAt: Math.min(intent.expiresAt, now + 120),
  };
}
export function validateContext(c, intent, registry, now) {
  closed(c, [
    "version",
    "intentDigest",
    "requestNonce",
    "authorizationId",
    "sessionId",
    "challengeNonce",
    "principal",
    "rpId",
    "origin",
    "enrollmentEpoch",
    "registrySha256",
    "workerImageDigest",
    "issuedAt",
    "expiresAt",
    "challengeIssuedAt",
    "challengeExpiresAt",
  ]);
  const expected = contextFor(intent, registry, c.sessionId, c.challengeNonce, c.challengeIssuedAt);
  demand(
    jcs(c) === jcs(expected) &&
      /^[0-9a-f]{64}$/.test(c.challengeNonce) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.sessionId),
    "CONTEXT_INVALID",
  );
  demand(
    Number.isSafeInteger(now) && now >= c.challengeIssuedAt && now < c.challengeExpiresAt,
    "CHALLENGE_EXPIRED",
  );
}
export const challenge = (c) =>
  Buffer.from(digest("TEST/YourMeal/A5/webauthn/challenge/v1", c), "hex");
export function derSignature(bytes) {
  demand(
    bytes.length >= 8 && bytes.length <= 72 && bytes[0] === 0x30 && bytes[1] === bytes.length - 2,
    "SIGNATURE_ENCODING",
  );
  let i = 2;
  for (let n = 0; n < 2; n++) {
    demand(bytes[i++] === 2, "SIGNATURE_ENCODING");
    const size = bytes[i++];
    demand(
      size >= 1 &&
        size <= 33 &&
        i + size <= bytes.length &&
        (bytes[i] & 0x80) === 0 &&
        !(size > 1 && bytes[i] === 0 && (bytes[i + 1] & 0x80) === 0),
      "SIGNATURE_ENCODING",
    );
    i += size;
  }
  demand(i === bytes.length, "SIGNATURE_ENCODING");
}
export function verifyAssertion(intent, c, assertion, registry, counter, now) {
  const key = registryRecord(registry);
  validateContext(c, intent, registry, now);
  closed(assertion, [
    "version",
    "credentialId",
    "userHandle",
    "clientDataJSON",
    "authenticatorData",
    "signature",
  ]);
  demand(
    assertion.version === "TEST_WEBAUTHN_ASSERTION_V1" &&
      assertion.credentialId === registry.credentialId &&
      assertion.userHandle === null,
    "CREDENTIAL_MISMATCH",
  );
  const raw = unb64(assertion.clientDataJSON);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  const data = strictJson(text);
  closed(data, ["type", "challenge", "origin", "crossOrigin"]);
  demand(
    data.type === "webauthn.get" &&
      data.challenge === challenge(c).toString("base64url") &&
      data.origin === registry.origin &&
      data.crossOrigin === false,
    "CLIENT_DATA_INVALID",
  );
  const auth = unb64(assertion.authenticatorData);
  demand(
    auth.length === 37 && auth.subarray(0, 32).toString("hex") === sha(registry.rpId),
    "RP_INVALID",
  );
  // Profile deliberately forbids backup, attestation-data and extensions in assertions.
  demand(auth[32] === 0x05, "UP_UV_OR_FLAGS");
  const count = auth.readUInt32BE(33);
  demand(Number.isSafeInteger(counter) && counter >= 0 && count > counter, "COUNTER_INVALID");
  const sig = unb64(assertion.signature, 128);
  derSignature(sig);
  demand(
    verify("sha256", Buffer.concat([auth, Buffer.from(sha(raw), "hex")]), key, sig),
    "WEBAUTHN_SIGNATURE_INVALID",
  );
  return count;
}
export const evidenceDigest = (context, assertion) =>
  digest("TEST/YourMeal/A5/evidence/v1", { context, assertion });
