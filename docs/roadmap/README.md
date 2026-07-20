# Roadmap — Official v1

```text
FOUNDATION ✅
    ↓
DOMAIN MODEL          ← architecture review gate
    ↓
Dish Library          ← Module 01 (do not start until review approved)
    ↓
Ingredients
    ↓
Weekly Menus
    ↓
Customers
    ↓
Orders
    ↓
Production
    ↓
Kitchen
    ↓
Inventory
    ↓
Purchasing
    ↓
Logistics
    ↓
Accounting
    ↓
Customer Support
    ↓
Reports
    ↓
AI                    ← deferred (ADR 0008)
```

Full gate criteria: [Architecture Review](../05-architecture/architecture-review.md).

## Now

| Item | Status |
|------|--------|
| Foundation (auth, tenants, shells, i18n, schema, ADRs) | ✅ |
| Architecture Review documentation | ✅ (awaiting approval) |
| P0: route RBAC gates | Pending |
| P0: soft-delete enforcement (no hard DELETE) | Pending |
| P0: ServiceContext builder | Pending |
| Module 01 Dish Library UI | **Blocked** on review + P0 |

## Governance

- Architecture source of truth: `docs/` + ADRs + Cursor
- Lovable: UI / components / visual flows only, following docs
- Do not skip modules without an ADR exception

## Explicitly deferred

- AI features
- Offline sync
- Full monorepo (`apps/`, `packages/`)
- PostHog / Resend / Maps / Push (platform integrations later)
