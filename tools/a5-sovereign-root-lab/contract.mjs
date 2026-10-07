import { createHash, randomBytes } from "node:crypto";
export const productionExecution = "HARD_DISABLED";
export const versions = Object.freeze(["20261007020208", "20261007020245", "20261007020849"]);
export const sqlHashes = Object.freeze([
  "a4ae81e745ec556485b004aaff218af97dcd1b60d8f32a430a2b01440491dc47",
  "ffb41a798cddf851b34dc2bc7f63590edb33cdf3c69c1fa7b75ac914aeddf310",
  "303cd5971c63c726caa5cce234045baefba48a464d90c6150b3298e536024f4f",
]);
export function demand(ok, code) {
  if (!ok) throw new Error(code);
}
export function closed(value, keys, code = "SCHEMA_INVALID") {
  demand(
    value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype &&
      JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()),
    code,
  );
}
export function jcs(value) {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") {
    demand(/^[\x20-\x7e]*$/.test(value), "ASCII_PROFILE_REQUIRED");
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    demand(Number.isSafeInteger(value) && !Object.is(value, -0), "INTEGER_REQUIRED");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(jcs).join(",")}]`;
  demand(value && Object.getPrototypeOf(value) === Object.prototype, "PLAIN_OBJECT_REQUIRED");
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${jcs(k)}:${jcs(value[k])}`)
    .join(",")}}`;
}
// Closed ASCII/integer JCS profile. Parse before schema; reject duplicate keys at any depth.
export function strictJson(text) {
  demand(typeof text === "string" && Buffer.byteLength(text) <= 65536, "JSON_SIZE");
  let i = 0;
  const ws = () => {
    while (/[\t\r\n ]/.test(text[i] ?? "") && i < text.length) i++;
  };
  function string() {
    const start = i++;
    let escaped = false;
    while (i < text.length) {
      const c = text[i++];
      if (!escaped && c === '"') return JSON.parse(text.slice(start, i));
      if (!escaped && c === "\\") escaped = true;
      else escaped = false;
    }
    throw new Error("JSON_INVALID");
  }
  function value() {
    ws();
    const c = text[i];
    if (c === '"') return string();
    if (c === "{") {
      i++;
      ws();
      const obj = {};
      const keys = new Set();
      if (text[i] === "}") {
        i++;
        return obj;
      }
      for (;;) {
        ws();
        demand(text[i] === '"', "JSON_INVALID");
        const key = string();
        demand(!keys.has(key), "DUPLICATE_KEY");
        keys.add(key);
        ws();
        demand(text[i++] === ":", "JSON_INVALID");
        Object.defineProperty(obj, key, { value: value(), enumerable: true, writable: true });
        ws();
        if (text[i] === "}") {
          i++;
          return obj;
        }
        demand(text[i++] === ",", "JSON_INVALID");
      }
    }
    if (c === "[") {
      i++;
      ws();
      const arr = [];
      if (text[i] === "]") {
        i++;
        return arr;
      }
      for (;;) {
        arr.push(value());
        ws();
        if (text[i] === "]") {
          i++;
          return arr;
        }
        demand(text[i++] === ",", "JSON_INVALID");
      }
    }
    const token = /^(true|false|null|-?(?:0|[1-9][0-9]*))/.exec(text.slice(i));
    demand(token, "JSON_INVALID");
    i += token[0].length;
    return JSON.parse(token[0]);
  }
  const result = value();
  ws();
  demand(i === text.length, "JSON_TRAILING");
  jcs(result);
  return result;
}
export const sha = (data) => createHash("sha256").update(data).digest("hex");
export const digest = (domain, data) =>
  sha(Buffer.concat([Buffer.from(domain + "\0"), Buffer.from(jcs(data))]));
export const nonce = () => randomBytes(32).toString("hex");
export function unb64(s, max = 16384) {
  demand(typeof s === "string" && /^[A-Za-z0-9_-]+$/.test(s) && s.length <= max, "BASE64_INVALID");
  const b = Buffer.from(s, "base64url");
  demand(b.toString("base64url") === s, "BASE64_NONCANONICAL");
  return b;
}
export function validIntent(x) {
  closed(x, [
    "version",
    "operation",
    "gate",
    "environment",
    "repository",
    "sourceSha",
    "executorToolingSha",
    "executorBinarySha256",
    "manifestSha256",
    "migrationVersions",
    "migrationSha256",
    "providerProjectRef",
    "expectedLedgerBefore",
    "expectedLedgerAfter",
    "requestNonce",
    "issuedAt",
    "expiresAt",
    "githubRunId",
    "githubRunAttempt",
    "githubEnvironmentId",
    "workerImageDigest",
  ]);
  demand(
    x.version === "TEST_A5_INTENT_V1" &&
      x.operation === "TEST_A5_DIRECTED_PROVIDER_MIGRATION" &&
      x.gate === "TEST_GATE6" &&
      x.environment === "TEST_PRODUCTION_DB" &&
      x.repository === "TEST/ROOT" &&
      x.providerProjectRef === "TEST_ONLY" &&
      x.githubEnvironmentId === "TEST_ENV" &&
      x.githubRunAttempt === 1,
    "PRODUCTION_HARD_DISABLED",
  );
  for (const k of ["sourceSha", "executorToolingSha"])
    demand(/^[0-9a-f]{40}$/.test(x[k]), "SHA_INVALID");
  for (const k of ["executorBinarySha256", "manifestSha256", "requestNonce", "workerImageDigest"])
    demand(/^[0-9a-f]{64}$/.test(x[k]), "HASH_INVALID");
  demand(
    jcs(x.migrationVersions) === jcs(versions) && jcs(x.migrationSha256) === jcs(sqlHashes),
    "MIGRATION_SCOPE",
  );
  demand(
    x.manifestSha256 === digest("TEST/A5/manifest/v1", { versions, sqlHashes }),
    "MANIFEST_INVALID",
  );
  demand(x.expectedLedgerBefore === 61 && x.expectedLedgerAfter === 64, "LEDGER_SCOPE");
  demand(/^[0-9]+$/.test(x.githubRunId), "RUN_INVALID");
  demand(
    Number.isSafeInteger(x.issuedAt) &&
      Number.isSafeInteger(x.expiresAt) &&
      x.expiresAt > x.issuedAt &&
      x.expiresAt - x.issuedAt <= 1800,
    "TTL_INVALID",
  );
  jcs(x);
  return x;
}
export function intentDigest(x) {
  validIntent(x);
  return digest("TEST/YourMeal/A5/intent/v1", x);
}
export function fresh(x, now, margin = 0) {
  demand(Number.isSafeInteger(now) && now >= x.issuedAt && now + margin < x.expiresAt, "EXPIRED");
}
export function github(x, proof) {
  closed(proof, [
    "version",
    "approved",
    "reviewer",
    "initiator",
    "runId",
    "attempt",
    "environmentId",
    "sourceSha",
    "bypass",
    "protectedBranches",
    "preventSelfReview",
  ]);
  demand(
    proof.version === "TEST_GITHUB_FIXTURE_V1" &&
      proof.approved === true &&
      proof.reviewer === "TEST_ALEXANDER" &&
      proof.initiator === "TEST_PREPARER_APP" &&
      proof.runId === x.githubRunId &&
      proof.attempt === 1 &&
      proof.environmentId === x.githubEnvironmentId &&
      proof.sourceSha === x.sourceSha &&
      proof.bypass === false &&
      proof.protectedBranches === true &&
      proof.preventSelfReview === true,
    "GITHUB_FIXTURE_DENIED",
  );
}
