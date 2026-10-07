import { generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { digest, intentDigest, nonce, sha, sqlHashes, versions } from "./contract.mjs";
import { challenge } from "./proof.mjs";
import { TestRoot } from "./root.mjs";
import { TestWorker } from "./worker.mjs";
export function authenticator() {
  const key = generateKeyPairSync("ec", { namedCurve: "prime256v1" }),
    credentialId = randomBytes(32).toString("base64url");
  const registry = {
    version: "TEST_REGISTRY_V1",
    principal: "TEST_ALEXANDER",
    credentialId,
    keyJwk: key.publicKey.export({ format: "jwk" }),
    rpId: "localhost",
    origin: "http://localhost:8787",
    enrollmentEpoch: 1,
  };
  return {
    registry,
    assert(
      c,
      {
        counter = 1,
        flags = 5,
        rpId = "localhost",
        origin = registry.origin,
        type = "webauthn.get",
        crossOrigin = false,
        wireChallenge = challenge(c).toString("base64url"),
      } = {},
    ) {
      const client = Buffer.from(
          JSON.stringify({ type, challenge: wireChallenge, origin, crossOrigin }),
        ),
        data = Buffer.alloc(37);
      Buffer.from(sha(rpId), "hex").copy(data);
      data[32] = flags;
      data.writeUInt32BE(counter, 33);
      return {
        version: "TEST_WEBAUTHN_ASSERTION_V1",
        credentialId,
        userHandle: null,
        clientDataJSON: client.toString("base64url"),
        authenticatorData: data.toString("base64url"),
        signature: sign(
          "sha256",
          Buffer.concat([data, Buffer.from(sha(client), "hex")]),
          key.privateKey,
        ).toString("base64url"),
      };
    },
  };
}
export async function fixture() {
  const dir = mkdtempSync(join(realpathSync("/tmp"), "a5-root-lab-")),
    authority = join(dir, "authority.sqlite"),
    admissions = join(dir, "worker.sqlite");
  let now = 1900000000;
  const primary = authenticator(),
    backup = authenticator(),
    clock = () => now;
  const intent = {
    version: "TEST_A5_INTENT_V1",
    operation: "TEST_A5_DIRECTED_PROVIDER_MIGRATION",
    gate: "TEST_GATE6",
    environment: "TEST_PRODUCTION_DB",
    repository: "TEST/ROOT",
    sourceSha: "1".repeat(40),
    executorToolingSha: "1".repeat(40),
    executorBinarySha256: sha("TEST_BINARY"),
    manifestSha256: digest("TEST/A5/manifest/v1", { versions, sqlHashes }),
    migrationVersions: [...versions],
    migrationSha256: [...sqlHashes],
    providerProjectRef: "TEST_ONLY",
    expectedLedgerBefore: 61,
    expectedLedgerAfter: 64,
    requestNonce: nonce(),
    issuedAt: now,
    expiresAt: now + 1800,
    githubRunId: "123",
    githubRunAttempt: 1,
    githubEnvironmentId: "TEST_ENV",
    workerImageDigest: sha("TEST_IMAGE"),
  };
  const githubProof = {
    version: "TEST_GITHUB_FIXTURE_V1",
    approved: true,
    reviewer: "TEST_ALEXANDER",
    initiator: "TEST_PREPARER_APP",
    runId: "123",
    attempt: 1,
    environmentId: "TEST_ENV",
    sourceSha: intent.sourceSha,
    bypass: false,
    protectedBranches: true,
    preventSelfReview: true,
  };
  const root = new TestRoot(authority, [primary.registry, backup.registry], clock);
  await root.init();
  const worker = (overrides = {}) =>
    new TestWorker({
      authority,
      admissions,
      intent,
      registry: primary.registry,
      publicKey: root.publicKey,
      githubRead: async () => structuredClone(githubProof),
      clock,
      ...overrides,
    });
  return {
    dir,
    authority,
    admissions,
    intent,
    githubProof,
    root,
    primary,
    backup,
    worker,
    now: () => now,
    setNow: (v) => {
      now = v;
    },
    advance: (delta) => {
      now += delta;
    },
    id: () => intentDigest(intent),
    prepare: () => root.prepare(intent, githubProof, primary.registry.credentialId),
    async approved() {
      const c = await this.prepare();
      return root.verify(c.authorizationId, primary.assert(c));
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
