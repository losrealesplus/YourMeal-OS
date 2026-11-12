# Gate 7 — Smoke Retry #574 Exact Interval Reconciliation

## Context

- Active production baseline (`production-worker`, GitHub Deployment `7692130125`):
  - Commit: `f585c653795967d6d2161d6be04e361b9566ef39`
  - Cloudflare Worker (`yourmeal-instance-eatclean`): Version ID `f467a3b2-b5bc-4672-ac9b-379e4da936d0`, Deployment ID `7dd0fb4f-a849-4aae-a3a9-b04500c8214c` (run `#42885576096`, `gate7-release-report-42885576096-1` `state=DEPLOYED`, `mutationStarted=true`).
- Pending delta on `main` (`70ab2a73608dcdb4070d6772a6bfb9a7cfcf06de`, PR `#574`):
  - `docs/99-internal/development-journal/2026-11-11-gate7-run-42885576096-smoke-recovery.md` (`NON_DEPLOYABLE`)
  - `scripts/governance/release-publication.spec.mjs` (`SPECIAL`)
  - `scripts/governance/release-publish.mjs` (`SPECIAL`)
- Gate 7 push run `#43198455397` stopped closed at `Classify outstanding main changes` with `REQUIRES_SEPARATE_AUTHORIZATION` because `main` lacked an `exact_interval` reconciliator anchored to `f585c653795967d6d2161d6be04e361b9566ef39` / deployment `7692130125`.

## Scope & Fail-Closed Boundaries

This governance-only reconciliation PR adds `SMOKE_RETRY_574`:
- Pinned to baseline `f585c653795967d6d2161d6be04e361b9566ef39` / deployment `7692130125` / version `f467a3b2-b5bc-4672-ac9b-379e4da936d0`.
- Pinned to PR `#574` (`70ab2a73608dcdb4070d6772a6bfb9a7cfcf06de`) exact Git blob hashes plus the exact 8 governance paths of this reconciliation PR.
- Rejects any additional commits, unlisted paths, SQL/migrations, or product/runtime changes (`src/`, `public/`, `instances/`).
- Keeps `push` to `main` failing closed; only an explicit human-reviewed `workflow_dispatch` (`mode=exact_interval`) with matching `exact_interval_scope` and canonical SHA-256 `authorization_id` plus protected `production-worker` environment approval may publish.
