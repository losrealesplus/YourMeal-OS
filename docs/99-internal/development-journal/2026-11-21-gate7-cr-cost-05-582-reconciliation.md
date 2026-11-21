# Gate 7 — Market Intelligence Core (PR1–PR5 · PR #576–#582) Exact Interval Reconciliation

## Context

- Active production baseline (`production-worker`, GitHub Deployment `7743677316`):
  - Commit: `f3a505ba2c05cff29107b568233a077f7e4adc55`
  - Cloudflare Worker (`yourmeal-instance-eatclean`): Version ID `841c4fb0-b459-40aa-9233-01cc6d3c50c7`, Deployment ID `ef72f8c5-403c-460e-b556-cdde1ce76b8f` (run `#43262513337`, `gate7-release-report-43262513337-1`, `state=DEPLOYED`, `mutationStarted=true`, `smoke=PASS`).
- Pending delta on `main` (`c60da942f6bbac9cb0378a231458caaf9b55a3ab`, PRs `#576–#582`):
  - PR #576 (`a72368e7`): Core contract, integrity, RLS, 1:N mappings.
  - PR #577 (`5555be62`): Physical formats, geo coverage & fiscal metadata (PR2).
  - PR #578 (`0b96726a`): Multi-tenant security, module activation & economic integrity (PR3A).
  - PR #579 (`04d2c5a1`): Physical formats, fiscal metadata & volume tiers contract (PR2B).
  - PR #580 (`6dad35e4`): Offer comparator, landed cost & explainable ranking (PR3).
  - PR #581 (`5103d9ca`): Secure ingestion, auditable batches, PDF/image extraction & OFF enrichment (PR4).
  - PR #582 (`c60da942`): Public connectors, isolated adapters, rate limiting & anti-scraping policy (PR5).
- Gate 7 push run `#44937823874` and dispatch run `#44942340175` stopped closed at `Classify outstanding main changes` with `REQUIRES_SEPARATE_AUTHORIZATION` because `main` contained database migrations (`supabase/migrations/*.sql`) and lacked an interval reconciliator anchored to `f3a505ba2c05cff29107b568233a077f7e4adc55` / deployment `7743677316`.

## Scope & Fail-Closed Boundaries

This governance reconciliation adds `CR_COST_05_582`:
- Pinned to baseline `f3a505ba2c05cff29107b568233a077f7e4adc55` / deployment `7743677316` / version `841c4fb0-b459-40aa-9233-01cc6d3c50c7`.
- Pinned to candidate commit `c60da942f6bbac9cb0378a231458caaf9b55a3ab` (PR `#582`), covering all 7 reviewed product PRs (`[576, 577, 578, 579, 580, 581, 582]`, 73 unique reviewed product files) with exact Git blob hashes.
- Authorizes release preparation via explicit `workflow_dispatch` (both `mode=exact_interval` with scope token and `mode=normal` with human operator reason acknowledging database migration execution).
- Rejects any unreviewed commits, foreign branches, or tampered file hashes.
- Gate 7 never executes SQL migrations (`productionSqlAuthorized: false`, `migrationExecutionAuthorized: false`). Database migrations are governed strictly under Gate 6.
- Preserves the sovereign human approval gate in GitHub Environment `production-worker` in Phase 2 before any code is published to Cloudflare Workers (`productionWorkerApprovalGranted: false`).
