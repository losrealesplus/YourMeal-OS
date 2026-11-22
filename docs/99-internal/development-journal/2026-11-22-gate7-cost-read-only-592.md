# Gate 7 — Cost Intelligence Read-Only Banner Fix (PR #591–#592) Reconciliation

## Context

- **Active Production Baseline** (`production-worker`, GitHub Deployment `7979664051`):
  - Commit: `891f18c8047f04ff9a827aa90bc44a1174db4748`
  - Cloudflare Worker (`yourmeal-instance-eatclean`): Version ID `ba7695b3-37a9-469f-87a2-a3130da3e9ad`, Deployment ID `7979664051` (run `#45029597979`, `gate7-release-report-45029597979-1`, `state=DEPLOYED`, `mutationStarted=true`, `smoke=PASS`).
- **Product Delta on `main`** (`0ba407d8fb4b7a3957c4a462f1de38bb7fab611f`, PRs `#591–#592`):
  - PR #591 (`a12e6a1da3d92d08c889288c9798e0f384feb119`): Eliminate flash and duplicate read-only banners in cockpit and shell. Accidental touch in `src/services/feature-flag-service.ts`.
  - PR #592 (`0ba407d8fb4b7a3957c4a462f1de38bb7fab611f`): Restore `src/services/feature-flag-service.ts` to exact baseline blob `489f06d9ca78037e9d747f725fdaa6f2ebdba57b` (0 net diff against baseline).
- Gate 7 run `#45032682254` (post-PR 591) and run `#45033446748` (post-PR 592) stopped closed at `Classify outstanding main changes` with `REQUIRES_SEPARATE_AUTHORIZATION` because `changedPaths` walks all intermediate first-parent commits in the release interval and includes `src/services/feature-flag-service.ts`, which is classified as `SPECIAL` under `release-contract.mjs` (`^src\/services\/`).

## Scope & Fail-Closed Boundaries

This governance reconciliation adds `COST_READ_ONLY_592`:
- Pinned to baseline `891f18c8047f04ff9a827aa90bc44a1174db4748` / deployment `7979664051` / version `ba7695b3-37a9-469f-87a2-a3130da3e9ad`.
- Pinned to candidate commit `a12e6a1da3d92d08c889288c9798e0f384feb119` (PR `#591`) and revert commit `0ba407d8fb4b7a3957c4a462f1de38bb7fab611f` (PR `#592`).
- Verifies that `src/services/feature-flag-service.ts` in target has blob `489f06d9ca78037e9d747f725fdaa6f2ebdba57b` (identical to production baseline, zero net modification).
- Verifies net product files are strictly the 6 UI files in `src/components/`, `src/routes/`, and `src/modules/market-intelligence/` with exact Git blob hashes.
- Authorizes release preparation via `deploy-production.yml` (both `mode=normal` with human operator reason and `mode=exact_interval`).
- Rejects any unreviewed commits, foreign branches, or tampered file hashes.
- Gate 7 never executes SQL migrations (`productionSqlAuthorized: false`, `migrationExecutionAuthorized: false`).
- Preserves the sovereign human approval gate in GitHub Environment `production-worker` in Phase 2 before any code is published to Cloudflare Workers (`productionWorkerApprovalGranted: false`).
