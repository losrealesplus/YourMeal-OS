# Testing strategy

Tests are not required for every Foundation Lock change, but the strategy is fixed so Module 01+ does not invent ad-hoc approaches.

## Layers

| Layer | What | Where (target) | Tools (suggested) |
|-------|------|----------------|-------------------|
| **Unit** | Domain pure functions, state transitions, capability matrix helpers, formatters | `*.test.ts` next to domain / permissions / localization | Vitest |
| **Integration** | Service + Repository against local/test Supabase or mocked repo | `src/modules/**/application/*.integration.test.ts` | Vitest + test DB |
| **E2E** | Critical user journeys (auth, dish create, order place) | `e2e/` | Playwright (later) |

## Rules

1. Business rules are tested at **Service / domain** level — not by clicking every button.
2. Repositories are thin; prefer integration tests for query correctness and RLS assumptions.
3. UI tests focus on wiring and accessibility, not re-testing domain math.
4. Do not start a large E2E suite before Module 01 has a stable happy path.

## Priority when Module 01 starts

1. Unit: Dish state transitions + capability checks for `dishes.*`
2. Integration: `DishService.archive` / `restore` (no hard delete)
3. E2E: staff creates a draft dish (smoke)

## Out of scope now

- Full coverage mandate
- Snapshot-testing entire pages
- Load/performance suites
