import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  digest,
  jcs,
  productionExecution,
  sha,
  strictJson,
  unb64,
  validIntent,
  versions,
} from "./contract.mjs";
import { registryRecord } from "./proof.mjs";
import { fixture } from "./fixtures.mjs";
import { store } from "./store.mjs";
async function lab(t) {
  const f = await fixture();
  t.after(f.cleanup);
  return f;
}
const clone = (x) => structuredClone(x),
  rejects = (fn, p) => assert.rejects(fn, p);
test("literal production denial and real target forbidden", async (t) => {
  const f = await lab(t);
  assert.equal(productionExecution, "HARD_DISABLED");
  for (const k of [
    "version",
    "operation",
    "gate",
    "environment",
    "repository",
    "providerProjectRef",
    "githubEnvironmentId",
  ]) {
    const x = clone(f.intent);
    x[k] = k === "providerProjectRef" ? "nhirlpkuvonggctdzzad" : "production";
    assert.throws(() => validIntent(x), /HARD_DISABLED/);
  }
});
test("ASCII integer JCS vectors and domain separation", () => {
  assert.equal(jcs({ b: [2, true, null, 'a"b'], a: 1 }), '{"a":1,"b":[2,true,null,"a\\"b"]}');
  assert.equal(digest("a", { b: 2, a: 1 }), digest("a", { a: 1, b: 2 }));
  assert.notEqual(digest("a", { a: 1 }), digest("b", { a: 1 }));
  for (const x of [1.5, NaN, Infinity, -0, "é", undefined, new Date()]) assert.throws(() => jcs(x));
});
for (const [s, p] of [
  ['{"a":1,"a":2}', /DUPLICATE/],
  ['{"x":{"a":1,"\\u0061":2}}', /DUPLICATE/],
  ['{"a":1} false', /TRAILING/],
  ["[1,]", /JSON/],
  ["1e3", /TRAILING/],
  ['{"a":1.5}', /JSON/],
  ['"é"', /ASCII/],
  ['{"__proto__":{},"__proto__":1}', /DUPLICATE/],
])
  test("strict JSON rejects " + s, () => assert.throws(() => strictJson(s), p));
test("parser no pollution and bounded input", () => {
  strictJson('{"__proto__":{"polluted":true}}');
  assert.equal({}.polluted, undefined);
  assert.throws(() => strictJson(" ".repeat(65537)), /SIZE/);
});
test("canonical base64 aliases denied", () => {
  assert.equal(unb64("AA").length, 1);
  for (const x of ["AA=", "AB", "+A", ""]) assert.throws(() => unb64(x));
});
for (const [n, edit] of [
  ["unknown", (x) => (x.approved = true)],
  ["rerun", (x) => (x.githubRunAttempt = 2)],
  ["fourth", (x) => x.migrationVersions.push("4")],
  ["order", (x) => x.migrationVersions.reverse()],
  ["SQL", (x) => (x.migrationSha256[0] = sha("BAD"))],
  ["manifest", (x) => (x.manifestSha256 = sha("BAD"))],
  ["ledger", (x) => (x.expectedLedgerBefore = 62)],
  ["long TTL", (x) => x.expiresAt++],
  ["nonce", (x) => (x.requestNonce = "x")],
])
  test("intent denial " + n, async (t) => {
    const f = await lab(t),
      x = clone(f.intent);
    edit(x);
    assert.throws(() => validIntent(x));
  });
for (const [n, edit] of [
  ["PAT only", (x) => (x.version = "PAT")],
  ["self", (x) => (x.initiator = "TEST_ALEXANDER")],
  ["reviewer", (x) => (x.reviewer = "agent")],
  ["bypass", (x) => (x.bypass = true)],
  ["branches", (x) => (x.protectedBranches = false)],
  ["self policy", (x) => (x.preventSelfReview = false)],
  ["run", (x) => (x.runId = "321")],
  ["SHA", (x) => (x.sourceSha = "0".repeat(40))],
  ["env", (x) => (x.environmentId = "wrong")],
  ["unapproved", (x) => (x.approved = false)],
  ["unknown", (x) => (x.token = "TEST")],
])
  test("GitHub denial " + n, async (t) => {
    const f = await lab(t);
    edit(f.githubProof);
    await rejects(() => f.prepare());
  });
for (const [n, opts] of [
  ["no UV", { flags: 1 }],
  ["no UP", { flags: 4 }],
  ["BE", { flags: 13 }],
  ["BS", { flags: 21 }],
  ["ED", { flags: 133 }],
  ["zero", { counter: 0 }],
  ["RP", { rpId: "example.com" }],
  ["origin", { origin: "https://example.com" }],
  ["iframe", { crossOrigin: true }],
  ["type", { type: "webauthn.create" }],
  ["challenge", { wireChallenge: "AA" }],
])
  test("assertion denial " + n, async (t) => {
    const f = await lab(t),
      c = await f.prepare();
    await rejects(() => f.root.verify(f.id(), f.primary.assert(c, opts)));
    assert.equal((await store(f.authority, "read", { id: f.id() })).state, "PREPARED");
  });
test("61→62→63→64 readback each + chained audit", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  for (let i = 0; i < 3; i++) {
    const r = await w.step(versions[i]);
    assert.equal(r.ledger, 62 + i);
    assert.equal(r.catalog, 62 + i);
  }
  assert.equal((await w.reconcile()).state, "COMPLETE");
  await rejects(() => w.step("fourth"));
  let prev = "0".repeat(64);
  const events = await store(f.authority, "audit", {});
  for (const e of events) {
    assert.equal(e.previous, prev);
    assert.equal(e.hash, sha(prev + "\0" + e.body));
    prev = e.hash;
  }
  assert.equal(events.length, 10);
});
test("signature tamper and wrong credential deny", async (t) => {
  const f = await lab(t),
    c = await f.prepare(),
    a = f.primary.assert(c);
  a.signature = Buffer.alloc(70).toString("base64url");
  await rejects(() => f.root.verify(f.id(), a));
  await rejects(() => f.root.verify(f.id(), f.backup.assert(c)));
});
test("assertion replay denial", async (t) => {
  const f = await lab(t),
    c = await f.prepare(),
    a = f.primary.assert(c);
  await f.root.verify(f.id(), a);
  await rejects(() => f.root.verify(f.id(), a), /ALREADY/);
});
test("backup TEST proof; production registry denied", async (t) => {
  const f = await lab(t),
    c = await f.root.prepare(f.intent, f.githubProof, f.backup.registry.credentialId),
    b = await f.root.verify(f.id(), f.backup.assert(c));
  assert.equal(
    b.envelope.payload.humanCredentialIdHash,
    sha(unb64(f.backup.registry.credentialId)),
  );
  const r = clone(f.primary.registry);
  r.principal = "Alexander";
  assert.throws(() => registryRecord(r));
});
for (const n of [
  "authorizationId",
  "intentDigest",
  "requestNonce",
  "sourceSha",
  "manifestSha256",
  "executorBinarySha256",
  "providerProjectRef",
  "sessionId",
  "workerImageDigest",
  "uv",
  "verificationTime",
  "counterAfter",
  "registrySha256",
  "githubRunId",
])
  test("receipt altered " + n, async (t) => {
    const f = await lab(t),
      b = await f.approved();
    b.envelope.payload[n] = "FORGED";
    await rejects(() => f.worker().open(b));
  });
test("verifier signature alone insufficient", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  b.assertion = f.primary.assert(b.context, { flags: 1 });
  await rejects(() => f.worker().open(b));
});
test("changed binary intent after proof deny", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  f.intent.executorBinarySha256 = sha("changed");
  await rejects(() => f.worker().open(b));
});
test("GitHub drift after assertion deny", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  f.githubProof.bypass = true;
  await rejects(() => f.worker().open(b));
});
test("unknown receipt fields and alg confusion deny", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  b.envelope.payload.approved = true;
  await rejects(() => f.worker().open(b));
  delete b.envelope.payload.approved;
  b.envelope.algorithm = "none";
  await rejects(() => f.worker().open(b));
});
test("copied receipt cannot reopen", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  await f.worker().open(b);
  await rejects(() => f.worker().open(b), /CONSUME/);
});
test("challenge expires at boundary", async (t) => {
  const f = await lab(t),
    c = await f.prepare();
  f.advance(120);
  await rejects(() => f.root.verify(f.id(), f.primary.assert(c)), /CHALLENGE_EXPIRED/);
});
test("expired intent denies open", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  f.advance(1800);
  await rejects(() => f.worker().open(b), /EXPIRED/);
});
test("expiry during sequence no continuation but readback", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  await w.step(versions[0]);
  f.advance(1700);
  await rejects(() => w.step(versions[1]), /EXPIRED/);
  const r = await w.reconcile();
  assert.equal(r.ledger, 62);
  assert.equal(r.state, "UNCERTAIN");
  await rejects(() => w.step(versions[1]));
});
test("revocation no second step", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  await w.step(versions[0]);
  await w.revoke();
  await rejects(() => w.step(versions[1]));
  assert.equal(w.calls.length, 1);
  assert.equal((await w.reconcile()).state, "REVOKED");
});
test("credential revoked before consume", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  await store(f.authority, "revoke_credential", { id: f.primary.registry.credentialId });
  await rejects(() => f.worker().open(b), /CREDENTIAL_REVOKED/);
});
for (const [outcome, ledger, catalog] of [
  ["before_ddl", 61, 61],
  ["ledger_missing", 61, 62],
  ["after_commit", 62, 62],
  ["unknown", 62, 62],
])
  test("failure " + outcome + " never retries", async (t) => {
    const f = await lab(t),
      w = f.worker(),
      b = await f.approved();
    await w.open(b);
    await rejects(() => w.step(versions[0], { outcome }));
    const r = await w.reconcile();
    assert.equal(r.ledger, ledger);
    assert.equal(r.catalog, catalog);
    assert.equal(r.state, "UNCERTAIN");
    await rejects(() => w.step(versions[0]));
    await rejects(() => f.worker().open(b));
    assert.equal(w.calls.length, 1);
  });
test("partial baseline denied", async (t) => {
  const f = await lab(t),
    w = f.worker();
  w.ledger = 62;
  await rejects(async () => w.open(await f.approved()), /PRESTATE/);
});
test("read-only reconcile after expiry no repair", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  await rejects(() => w.step(versions[0], { outcome: "ledger_missing" }));
  const before = sha(readFileSync(f.authority));
  f.advance(2000);
  assert.equal((await w.reconcile()).classification, "DDL_COMMITTED_LEDGER_MISSING");
  assert.equal(sha(readFileSync(f.authority)), before);
  await rejects(() => store(f.authority, "repair", { id: f.id() }), /OPERATION_DENIED/);
});
test("100 separate CAS consumers exactly one", async (t) => {
  const f = await lab(t),
    p = (await f.approved()).envelope.payload;
  const r = await Promise.allSettled(
    Array.from({ length: 100 }, () =>
      store(f.authority, "consume", { id: f.id(), session: p.sessionId, now: f.now() }),
    ),
  );
  assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(r.filter((x) => x.status === "rejected").length, 99);
});
test("process death after committed CAS: no retry", async (t) => {
  const f = await lab(t),
    p = (await f.approved()).envelope.payload;
  await rejects(
    () =>
      store(f.authority, "consume", {
        id: f.id(),
        session: p.sessionId,
        now: f.now(),
        testCrashAfterCommit: true,
      }),
    /TRANSPORT_LOST:73/,
  );
  assert.equal((await store(f.authority, "read", { id: f.id() })).state, "CONSUMED_SESSION_OPEN");
  await rejects(
    () => store(f.authority, "consume", { id: f.id(), session: p.sessionId, now: f.now() }),
    /CONSUME_DENIED/,
  );
});
test("worker admission lost response preserves replay tombstone", async (t) => {
  const f = await lab(t),
    p = (await f.approved()).envelope.payload;
  await rejects(
    () =>
      store(f.admissions, "admit", {
        id: f.id(),
        session: p.sessionId,
        nonce: p.requestNonce,
        testCrashAfterCommit: true,
      }),
    /TRANSPORT/,
  );
  await rejects(
    () => store(f.admissions, "admit", { id: f.id(), session: p.sessionId, nonce: p.requestNonce }),
    /UNIQUE/,
  );
});
test("revocation/start race serialized", async (t) => {
  const f = await lab(t),
    p = (await f.approved()).envelope.payload;
  await store(f.authority, "consume", { id: f.id(), session: p.sessionId, now: f.now() });
  await Promise.allSettled([
    store(f.authority, "start", { id: f.id(), session: p.sessionId, index: 1, now: f.now() }),
    store(f.authority, "revoke", { id: f.id() }),
  ]);
  assert.equal((await store(f.authority, "read", { id: f.id() })).state, "REVOKED");
  await rejects(() =>
    store(f.authority, "start", { id: f.id(), session: p.sessionId, index: 2, now: f.now() }),
  );
});
test("paths and extra steps denied", async (t) => {
  const f = await lab(t);
  await f.approved();
  await rejects(() =>
    store(f.authority, "start", { id: f.id(), session: "wrong", index: 4, now: f.now() }),
  );
  await rejects(
    () => store("/private/tmp/production.sqlite", "read", { id: f.id() }),
    /LOCAL_ONLY/,
  );
});
test("same credential counter race across different intents admits only one proof", async (t) => {
  const f = await lab(t),
    first = await f.prepare();
  const secondIntent = clone(f.intent);
  secondIntent.requestNonce = sha("SECOND_TEST_NONCE");
  const second = await f.root.prepare(secondIntent, f.githubProof, f.primary.registry.credentialId);
  const r = await Promise.allSettled([
    f.root.verify(first.authorizationId, f.primary.assert(first)),
    f.root.verify(second.authorizationId, f.primary.assert(second)),
  ]);
  assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
});
test("nonce unique across intents and no registry replacement", async (t) => {
  const f = await lab(t);
  await f.prepare();
  const i = clone(f.intent);
  i.sourceSha = "2".repeat(40);
  const p = clone(f.githubProof);
  p.sourceSha = i.sourceSha;
  await rejects(() => f.root.prepare(i, p, f.primary.registry.credentialId), /UNIQUE/);
  await rejects(
    () => store(f.authority, "register", { id: f.primary.registry.credentialId, counter: 0 }),
    /UNIQUE/,
  );
});
test("clock backwards, unsafe number and negative counter denied", async (t) => {
  const f = await lab(t),
    c = await f.prepare();
  f.advance(-1);
  await rejects(() => f.root.verify(f.id(), f.primary.assert(c)), /EXPIRED/);
  assert.throws(() => strictJson("9007199254740992"), /INTEGER/);
});
test("revoked credential after first step denies next even with receipt", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  await w.step(versions[0]);
  await store(f.authority, "revoke_credential", { id: f.primary.registry.credentialId });
  await rejects(() => w.step(versions[1]), /CREDENTIAL_REVOKED/);
  assert.equal(w.calls.length, 1);
});
test("CAS outage does not execute any simulated step", async (t) => {
  const f = await lab(t),
    w = f.worker();
  await w.open(await f.approved());
  f.cleanup();
  await rejects(() => w.step(versions[0]));
  assert.equal(w.calls.length, 0);
});
test("receipt signature remains insufficient when proof raw bytes are substituted", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  const raw = Buffer.from(b.assertion.authenticatorData, "base64url");
  raw[36] = 2;
  b.assertion.authenticatorData = raw.toString("base64url");
  await rejects(() => f.worker().open(b), /SIGNATURE/);
});
test("UI read-only and local: no approval or enrollment endpoint", async () => {
  const { startLabUi } = await import("./server.mjs");
  const ui = await startLabUi(0);
  try {
    const page = await fetch(ui.url);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    const html = await page.text();
    assert.match(html, /TEST/);
    assert.match(html, /disabled/);
    assert.equal((await fetch(ui.url + "/approve", { method: "POST" })).status, 405);
    const data = await (await fetch(ui.url + "/demo.json")).json();
    assert.equal(data.intent.providerProjectRef, "TEST_ONLY");
    assert.equal(data.productionExecution, "HARD_DISABLED");
  } finally {
    await ui.close();
  }
});
test("candidate clock skew beyond 5s denies admission", async (t) => {
  const f = await lab(t),
    b = await f.approved();
  for (const delta of [-6, 6])
    await rejects(() => f.worker({ authorityClock: () => f.now() + delta }).open(b), /CLOCK_SKEW/);
  const w = f.worker({ authorityClock: () => f.now() + 5 });
  await w.open(b);
  assert.equal((await w.reconcile()).state, "CONSUMED_SESSION_OPEN");
});
test("concurrent assertion replay returns one receipt", async (t) => {
  const f = await lab(t),
    c = await f.prepare(),
    a = f.primary.assert(c);
  const r = await Promise.allSettled([f.root.verify(f.id(), a), f.root.verify(f.id(), a)]);
  assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
});
test("challenge expiry rechecked at durable CAS, closing verification TOCTOU", async (t) => {
  const f = await lab(t),
    c = await f.prepare();
  const row = await store(f.authority, "read", { id: f.id() });
  const prepared = JSON.parse(row.body);
  await rejects(
    () =>
      store(f.authority, "verify", {
        id: f.id(),
        credential: f.primary.registry.credentialId,
        before: 0,
        after: 1,
        now: c.challengeExpiresAt,
        body: prepared,
      }),
    /CHALLENGE_EXPIRED_AT_CAS/,
  );
  assert.equal(
    (await store(f.authority, "credential", { id: f.primary.registry.credentialId })).counter,
    0,
  );
});
test("CAS cannot substitute frozen intent after cryptographic verification", async (t) => {
  const f = await lab(t),
    c = await f.prepare(),
    row = await store(f.authority, "read", { id: f.id() }),
    body = JSON.parse(row.body);
  body.intent.sourceSha = "2".repeat(40);
  await rejects(
    () =>
      store(f.authority, "verify", {
        id: f.id(),
        credential: f.primary.registry.credentialId,
        before: 0,
        after: 1,
        now: c.challengeIssuedAt,
        body,
      }),
    /FROZEN_BINDING/,
  );
});
