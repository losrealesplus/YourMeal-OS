# OP-001.1 · Bootstrap Validation

**Tipo:** validation + integrity (post OP-001 technical restore)  
**Branch:** `cursor/op-001-1-bootstrap-validation-f54a`  
**Base:** `cursor/op-001-operational-bootstrap-f54a` (then `main` after OP-001 merges)  
**Estado:** Active

---

## Why this PR exists

OP-001 repaired bootstrap **infrastructure** (screens, services, entry).  
FOPEBA still requires proof that bootstrap is **operable** and that **impossible states are refused**.

| Layer | OP-001 | OP-001.1 |
|-------|--------|---------|
| Architecture / code surfaces | ✅ | — |
| Impossible-state guards | partial | ✅ WP-7 |
| Day-0 checklist evidence | — | ✅ WP-8 |
| Integrity smoke command | — | ✅ WP-9 |
| State machine doc | — | ✅ WP-10 |
| First saas_admin without SQL | SQL runbook | ✅ `npm run seed` |
| Live journey evidence | pending | checklist + verify --live |

---

## Work packages delivered

### WP-7 · Bootstrap Integrity Audit

Pure rules in `src/modules/bootstrap-integrity` wired into:

- Weekly menu compose/publish
- Staff invite
- Order programming (aligned message)
- Company Admin invite (tenant must exist + active)
- Ops UI banners (home, menus, kitchen, delivery)

### WP-8 · Day-0 checklist

`docs/10-validation/OP001_DAY0_CHECKLIST.md`

### WP-9 · `bootstrap:verify`

```bash
npm run bootstrap:verify
npm run bootstrap:verify -- --live --tenant=eatclean-tenerife
```

### WP-10 · State machine

`docs/05-architecture/BOOTSTRAP_STATE_MACHINE.md`

### Day-0 seed (no manual SQL)

```bash
npm run seed
```

---

## Verdict (this PR)

| Área | Estado |
|------|--------|
| Integrity rules + tests | PASS |
| Service guards | PASS |
| Docs (checklist + state machine) | PASS |
| seed / bootstrap:verify commands | PASS |
| Live E2E evidence attached | PENDING (fill Day-0 checklist on deployed env) |

**Merge recommendation:** Yes for validation package.  
**Bootstrap operational closure:** after Day-0 checklist PASS with evidence → then CHECK-IT 05.
