import { demand, fresh, github, intentDigest, jcs, versions } from "./contract.mjs";
import { verifyReceipt } from "./root.mjs";
import { store } from "./store.mjs";
// No database client, cloud SDK, fetch, SQL, credentials or child executor. Simulated ledger only.
export class TestWorker {
  #authority;
  #admissions;
  #intent;
  #registry;
  #publicKey;
  #github;
  #clock;
  #authorityClock;
  #session = null;
  #index = 0;
  #dead = false;
  constructor({
    authority,
    admissions,
    intent,
    registry,
    publicKey,
    githubRead,
    clock,
    authorityClock = clock,
  }) {
    this.#authority = authority;
    this.#admissions = admissions;
    this.#intent = structuredClone(intent);
    this.#registry = structuredClone(registry);
    this.#publicKey = publicKey;
    this.#github = githubRead;
    this.#clock = clock;
    this.#authorityClock = authorityClock;
    this.ledger = 61;
    this.catalog = 61;
    this.calls = [];
  }
  checkClock() {
    demand(
      Number.isSafeInteger(this.#clock()) &&
        Number.isSafeInteger(this.#authorityClock()) &&
        Math.abs(this.#clock() - this.#authorityClock()) <= 5,
      "CLOCK_SKEW",
    );
  }
  async open(bundle) {
    this.checkClock();
    demand(!this.#session && !this.#dead, "SESSION_REOPEN_DENIED");
    const proof = await this.#github();
    const p = verifyReceipt(
      bundle,
      this.#intent,
      this.#registry,
      proof,
      this.#publicKey,
      this.#clock(),
    );
    const row = await store(this.#authority, "read", { id: p.authorizationId });
    const saved = JSON.parse(row.body);
    demand(
      saved.bundle &&
        jcs(saved.bundle) === jcs(bundle) &&
        this.ledger === 61 &&
        this.catalog === 61,
      "DURABLE_BINDING_OR_PRESTATE",
    );
    await store(this.#authority, "consume", {
      id: p.authorizationId,
      session: p.sessionId,
      now: this.#clock(),
    });
    try {
      await store(this.#admissions, "admit", {
        id: p.authorizationId,
        session: p.sessionId,
        nonce: p.requestNonce,
      });
    } catch (e) {
      this.#dead = true;
      await store(this.#authority, "uncertain", { id: p.authorizationId }).catch(() => {});
      throw e;
    }
    this.#session = p.sessionId;
  }
  async step(version, { outcome = "complete", afterStarted } = {}) {
    demand(
      this.#session && !this.#dead && this.#index < 3 && version === versions[this.#index],
      "STEP_SCOPE",
    );
    const id = intentDigest(this.#intent);
    const index = this.#index + 1;
    try {
      this.checkClock();
      fresh(this.#intent, this.#clock(), 120);
      github(this.#intent, await this.#github());
      demand(
        this.ledger === 61 + this.#index && this.catalog === 61 + this.#index,
        "PRESTATE_DRIFT",
      );
      await store(this.#authority, "start", {
        id,
        index,
        session: this.#session,
        now: this.#clock(),
      });
      if (afterStarted) await afterStarted();
      this.calls.push(version);
      if (outcome === "before_ddl") throw new Error("PROCESS_DIED");
      this.catalog++;
      if (outcome === "ledger_missing") throw new Error("DDL_COMMITTED_LEDGER_MISSING");
      this.ledger++;
      if (outcome === "after_commit") throw new Error("TRANSPORT_LOST_AFTER_COMMIT");
      demand(outcome === "complete", "READBACK_UNKNOWN");
      // The simulation readback is explicitly independent of the CAS state. No inferred SQL retry.
      demand(this.ledger === 61 + index && this.catalog === 61 + index, "READBACK_FAILED");
      await store(this.#authority, "verified", {
        id,
        index,
        session: this.#session,
        now: this.#clock(),
      });
      this.#index++;
      if (index === 3) await store(this.#authority, "complete", { id, session: this.#session });
      return this.reconcile();
    } catch (e) {
      this.#dead = true;
      await store(this.#authority, "uncertain", { id }).catch(() => {});
      throw e;
    }
  }
  async revoke() {
    await store(this.#authority, "revoke", { id: intentDigest(this.#intent) });
  }
  async reconcile() {
    return {
      version: "TEST_READBACK_V1",
      ledger: this.ledger,
      catalog: this.catalog,
      calls: [...this.calls],
      classification:
        this.ledger === this.catalog ? "SIMULATED_MATCH" : "DDL_COMMITTED_LEDGER_MISSING",
      state: (await store(this.#authority, "read", { id: intentDigest(this.#intent) })).state,
    };
  }
}
