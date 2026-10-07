# A5 Sovereign Root — TEST laboratory

**PRODUCTION HARD_DISABLED.** Keys, authenticator assertions, GitHub approvals and ledger progression are TEST. No hardware enrolment, cloud keys, production credentials, DB connection or SQL execution.

Requires Node >=22 and `/usr/bin/python3` with SQLite. No new npm dependencies, no application integration and no product package/workflow changes.

Run from repository root:

```sh
node tools/a5-sovereign-root-lab/qualify.mjs
node tools/a5-sovereign-root-lab/server.mjs
```

UI listens only on `127.0.0.1:8787`, serves read-only TEST scope and denies all POST actions. It does not call `navigator.credentials` or enrol a real key. Stop server with Ctrl-C. The assertion fixtures exercise real ES256 signatures over WebAuthn-shaped bytes; they do not demonstrate human presence or authenticator attestation.

The schema deliberately uses `TEST_*` operation/principal/repository/project and epoch-second candidate times. TEST registry has two generated ephemeral software keys. It is not the production receipt schema and cannot be promoted by renaming one field. Private key material is never persisted or logged. A temporary owned `a5-root-lab-*` directory under real `/tmp` contains two SQLite stores; tests remove only their own directory.

Authority store tests durable transaction/CAS, counter concurrency, expiry, revocation and chained events. Separate worker store rejects duplicate admission even if response was lost. Both are controlled by this local lab user: this does NOT certify independence of cloud custody or non-exportable signing. The worker does NOT execute the migrations: approved versions/hashes are scope evidence, its ledger/catalog are simulated values. Existing #507 executor stays unchanged/HARD_DISABLED.

A new intended process for the next migration is different from resuming after crash. All uncertainty ends the session; observation stays available but neither receipt nor reconcile allows repair or retry.

Container recipe requires an immutable Node Debian image supplied as LAB_NODE_IMAGE. Before build, validate it is `node:...@sha256:<64 lowerhex>`. Building uses Debian package repositories for Python; record installed Python/SQLite and pin the resulting container digest. No reproducible-build claim is made for unpinned apt dependencies. Runtime must use no network after image build. Recipe presence or Go cross-compile does NOT certify Linux: report execution evidence separately.

Remaining gates: real attestation/hardware/enrolment, OIDC/GitHub API verification, non-exportable signing, independent CAS/custody, workload credential plane, Linux/container run, live schema compatibility and exact production authorization. AWS/domain/custodians/TTL remain candidates.
