import { generateKeyPairSync, randomUUID, sign, verify } from "node:crypto";
import {
  closed,
  demand,
  digest,
  fresh,
  github,
  intentDigest,
  jcs,
  nonce,
  sha,
  unb64,
  validIntent,
} from "./contract.mjs";
import {
  challenge,
  contextFor,
  derSignature,
  evidenceDigest,
  registryRecord,
  verifyAssertion,
} from "./proof.mjs";
import { store } from "./store.mjs";
const receiptKeys = [
  "version",
  "authorizationId",
  "intentDigest",
  "requestNonce",
  "humanCredentialIdHash",
  "humanPrincipalId",
  "webauthnChallengeHash",
  "rpId",
  "origin",
  "uv",
  "up",
  "verificationTime",
  "issuedAt",
  "expiresAt",
  "githubRunId",
  "githubRunAttempt",
  "githubEnvironmentId",
  "sourceSha",
  "manifestSha256",
  "executorBinarySha256",
  "providerProjectRef",
  "sessionId",
  "workerImageDigest",
  "enrollmentEpoch",
  "registrySha256",
  "githubEvidenceSha256",
  "webauthnEvidenceSha256",
  "counterBefore",
  "counterAfter",
];
function signingBytes(payload) {
  return Buffer.from("TEST/YourMeal/A5/receipt/v1\0" + jcs(payload));
}
export function payloadFor(intent, c, assertion, registry, proof, count, now, before) {
  return {
    version: "TEST_RECEIPT_V1",
    authorizationId: intentDigest(intent),
    intentDigest: intentDigest(intent),
    requestNonce: intent.requestNonce,
    humanCredentialIdHash: sha(unb64(registry.credentialId)),
    humanPrincipalId: registry.principal,
    webauthnChallengeHash: sha(challenge(c)),
    rpId: registry.rpId,
    origin: registry.origin,
    uv: true,
    up: true,
    verificationTime: now,
    issuedAt: intent.issuedAt,
    expiresAt: intent.expiresAt,
    githubRunId: intent.githubRunId,
    githubRunAttempt: 1,
    githubEnvironmentId: intent.githubEnvironmentId,
    sourceSha: intent.sourceSha,
    manifestSha256: intent.manifestSha256,
    executorBinarySha256: intent.executorBinarySha256,
    providerProjectRef: intent.providerProjectRef,
    sessionId: c.sessionId,
    workerImageDigest: intent.workerImageDigest,
    enrollmentEpoch: registry.enrollmentEpoch,
    registrySha256: digest("TEST/registry/v1", registry),
    githubEvidenceSha256: digest("TEST/github/v1", proof),
    webauthnEvidenceSha256: evidenceDigest(c, assertion),
    counterBefore: before,
    counterAfter: count,
  };
}
export function verifyReceipt(bundle, intent, registry, proof, verifierPublicKey, now) {
  validIntent(intent);
  fresh(intent, now);
  github(intent, proof);
  closed(bundle, ["envelope", "context", "assertion"]);
  const e = bundle.envelope;
  closed(e, ["version", "algorithm", "encoding", "payload", "signature"]);
  closed(e.payload, receiptKeys);
  demand(
    e.version === "TEST_RECEIPT_ENVELOPE_V1" &&
      e.algorithm === "ECDSA_SHA_256" &&
      e.encoding === "ASN1_DER",
    "RECEIPT_PROFILE",
  );
  const sig = unb64(e.signature, 128);
  derSignature(sig);
  demand(
    verify("sha256", signingBytes(e.payload), verifierPublicKey, sig),
    "RECEIPT_SIGNATURE_INVALID",
  );
  // Reverify human proof, not just verifier signature. Historical proof evaluated at recorded verificationTime.
  const after = verifyAssertion(
    intent,
    bundle.context,
    bundle.assertion,
    registry,
    e.payload.counterBefore,
    e.payload.verificationTime,
  );
  const expected = payloadFor(
    intent,
    bundle.context,
    bundle.assertion,
    registry,
    proof,
    after,
    e.payload.verificationTime,
    e.payload.counterBefore,
  );
  demand(
    jcs(e.payload) === jcs(expected) && e.payload.verificationTime <= now,
    "RECEIPT_BINDING_INVALID",
  );
  return expected;
}
export class TestRoot {
  #key;
  #registries;
  #clock;
  #path;
  constructor(path, registries, clock) {
    this.#path = path;
    this.#clock = clock;
    this.#registries = new Map();
    for (const r of registries) {
      registryRecord(r);
      this.#registries.set(r.credentialId, structuredClone(r));
    }
    demand(this.#registries.size === 2, "TWO_TEST_KEYS_REQUIRED");
    this.#key = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    this.publicKey = this.#key.publicKey;
  }
  async init() {
    for (const r of this.#registries.values())
      await store(this.#path, "register", { id: r.credentialId, counter: 0 });
  }
  async prepare(intent, githubProof, credentialId) {
    validIntent(intent);
    fresh(intent, this.#clock());
    github(intent, githubProof);
    const r = this.#registries.get(credentialId);
    demand(r, "CREDENTIAL_MISSING");
    const context = contextFor(intent, r, randomUUID(), nonce(), this.#clock());
    await store(this.#path, "prepare", {
      id: context.authorizationId,
      nonce: intent.requestNonce,
      session: context.sessionId,
      expiry: intent.expiresAt,
      body: { intent: structuredClone(intent), githubProof: structuredClone(githubProof), context },
    });
    return context;
  }
  async verify(id, assertion) {
    const row = await store(this.#path, "read", { id });
    demand(row.state === "PREPARED", "ALREADY_VERIFIED");
    const { intent, githubProof, context } = JSON.parse(row.body);
    const registry = this.#registries.get(assertion.credentialId);
    demand(registry, "CREDENTIAL_MISSING");
    fresh(intent, this.#clock());
    github(intent, githubProof);
    demand(context.registrySha256 === digest("TEST/registry/v1", registry), "REGISTRY_MISMATCH");
    const cred = await store(this.#path, "credential", { id: registry.credentialId });
    demand(cred.active === 1, "CREDENTIAL_REVOKED");
    const count = verifyAssertion(
      intent,
      context,
      assertion,
      registry,
      cred.counter,
      this.#clock(),
    );
    const payload = payloadFor(
      intent,
      context,
      assertion,
      registry,
      githubProof,
      count,
      this.#clock(),
      cred.counter,
    );
    const envelope = {
      version: "TEST_RECEIPT_ENVELOPE_V1",
      algorithm: "ECDSA_SHA_256",
      encoding: "ASN1_DER",
      payload,
      signature: sign("sha256", signingBytes(payload), this.#key.privateKey).toString("base64url"),
    };
    const bundle = { envelope, context, assertion };
    await store(this.#path, "verify", {
      id,
      credential: registry.credentialId,
      before: cred.counter,
      after: count,
      now: this.#clock(),
      body: { intent, githubProof, context, bundle, credentialId: registry.credentialId },
    });
    return structuredClone(bundle);
  }
}
