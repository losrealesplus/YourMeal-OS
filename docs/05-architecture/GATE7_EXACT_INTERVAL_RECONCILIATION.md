# Gate7 — exact interval reconciliation contract

## Authorized context and boundaries

Human authorization: local implementation and qualification only, 2026-10-10.
The context check used FOUNDATION.md, AGENTS.md, permanent strategic/product/CTO context,
ENGINEERING_OPERATING_PROTOCOL.md, ADR-0101 and existing Gate7 contracts. This is a
release-governance change; product contracts, classification rules, migration execution,
provider state and the closed P34 recovery workstream remain outside this change.
No push, PR, merge, dispatch or deployment is authorized by this implementation.

## Sealed interval

Baseline: `8283d56092affa0e7aaa6bf26551a7098c82f561`.
Candidate: `b88aaf91a3be06a515e298c0079f80a5706dd0ef`.
PRs: 506, 507, 508, 509, 510, 511, 512, 513, in exact first-parent order.
113 paths: 36 DEPLOYABLE, 30 NON_DEPLOYABLE and 47 SPECIAL; these classifications persist.
The embedded raw manifest hash is
`94ed27e0683433413a52dd5c325d6776bc7f9680eab1365704ef8b0e471c4595`;
the embedded raw release-plan hash is
`0ecf1b33e6a1471d42d86a7ae9165031cc3ae14518c403ec5069b2a9c72aa8e4`.
Every sealed before/after Git blob hash and byte count is checked again against the
fresh baseline/candidate tree. A missing object, symlink or changed byte fails closed.

## The additional governance delta requires its own human authority

The candidate is not the eventual release source. If separately authorized for publication,
this branch must have exactly one canonical human merge immediately after the candidate,
with the candidate as first parent and the PR head as second parent. Squash merge and
intervening main commits are rejected. The branch name is fixed. The exact eleven governance
paths are defined by EXACT_GOVERNANCE_FILES; no product or migration changes are permitted.
The added test fixture change only supplies the new module to the existing CLI diagnostic test.
These eleven new paths add ten SPECIAL and one NON_DEPLOYABLE path: the complete
future interval has 124 paths and 57 SPECIAL paths, still requiring separate authority.

The final source SHA, merged governance PR, head SHA, exact changed paths and fresh
before/after hashes must be explicitly included in a later human-approved scope.
The code never self-signs its own added delta. The human scope is external workflow input;
its SHA-256 is calculated from recursively key-sorted compact JSON. Input must be exactly
that canonical JSON; duplicated keys, extra keys and changed bytes are rejected.
Both the sealed interval and the new governance delta are carried into Phase 2 and rechecked.

## Proposed future procedure, not authorized execution

After separate review/publication/merge authority and a canonical merge, an operator can
obtain a read-only proposal using `node scripts/governance/release-plan.mjs --exact-interval-payload`.
It checks current Git/GitHub metadata and emits payload, canonical exactIntervalScope and
authorizationId. It creates no release artifacts, dispatch, ledger or authority. It fails
on the current unmerged local branch. This command has not been executed against GitHub here.

A later owner-approved workflow_dispatch would use mode `exact_interval`, exact baseline,
exact final target, the eight sealed PRs plus the governance PR, exactIntervalScope and its
hash as authorization_id. The fresh run must be attempt 1, canonical main, and have both
actor and triggering_actor equal to the policy's human reviewer. Normal mode remains default.
Ordinary pushes, content validation and merging this code do not create authorization.
No generic privileged allowlist or historical reconciliation record is changed.

Successful exact classification is preparation eligibility, never production approval.
The existing protected production-worker environment, independent human approval,
Build Once → Deploy Exactly That, artifact verification and publication revalidation remain.
The scope explicitly sets production SQL, migrations, production-worker approval and OAuth
activation to false, A5 HARD_DISABLED and A4b CLOSED. These constraints declare the permitted
release scope; they do not certify current provider/runtime configuration.

## Verification and residual limits

Negative checks cover changed anchors, commits, paths, hashes, PRs, manifest, attempts,
actors, constraints and preparation/publication payload changes. Existing activation,
reconciliation, publication and JSON diagnostic regressions are retained.
Local results: 149 release/JSON/authorization regressions and 25 gatekeeper/broker tests PASS;
scoped ESLint, workflow YAML parsing and git diff whitespace checks PASS. Node 26.5.0 was
used locally; workflow Node 20 and full GitHub prepare/artifact/publish execution remain
unverified. Independent read-only review found no actionable critical/high/P2 defects.
No live workflow dispatch, provider check or deployment is part of this qualification.
Required CI and protected environment configuration must be checked at later release time.
Staging isolation, old CRM writers and the two P34 migrations remain release blockers.
No claim of production readiness or new P34 recovery certification is made.
