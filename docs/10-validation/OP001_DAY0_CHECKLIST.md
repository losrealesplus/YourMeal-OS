# OP-001 Day-0 Checklist

**Purpose:** Reproducible evidence that a clean deployment becomes an operational tenant end-to-end.  
**Linked:** OP-001 · OP-001.1 · OP-001.2 · RI-001 / CHECK-IT 05  
**Command helpers:** `npm run seed` · `npm run bootstrap:verify` · `npm run bootstrap:verify:ci`  
**Evidence pack:** [evidence/op001/](./evidence/op001/)

---

## Preconditions

```text
git clone
npm install
supabase db reset   # or linked remote project migrations applied
npm run seed        # first saas_admin — NO manual SQL
```

Env for seed:

| Variable | Required |
|----------|----------|
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | yes |
| `SEED_SAAS_ADMIN_EMAIL` | yes |
| `SEED_SAAS_ADMIN_PASSWORD` | yes (create path) |
| `SEED_SAAS_ADMIN_NAME` | optional |

---

## Checklist

Fill **Expected / Actual / Evidence ID** for each row. Evidence IDs map to files under `evidence/op001/`.

### Platform (SaaS Admin)

| Step | Expected Result | Actual Result | Evidence ID | Done |
|------|-----------------|---------------|-------------|------|
| Login as seeded `saas_admin` | Session valid | | EV-SEED-01 | ☐ |
| Lands on `/saas` | Home path `/saas` | | EV-NAV-01 | ☐ |
| Create Tenant | Tenant row created | | EV-TEN-01 | ☐ |
| Activate Tenant | `status=active` | | EV-TEN-02 | ☐ |
| Create / provision Company | Company account exists | | EV-CO-01 | ☐ |
| Company Settings | Branding/locale saved (or N/A) | | EV-CO-02 | ☐ |
| Invite Company Admin | Invite + role assigned | | EV-ADM-01 | ☐ |
| Assign Roles | kitchen/delivery/ops roles | | EV-ROL-01 | ☐ |

### Tenant (Company Admin)

| Step | Expected Result | Actual Result | Evidence ID | Done |
|------|-----------------|---------------|-------------|------|
| Login → `/admin` | Home path `/admin` | | EV-NAV-02 | ☐ |
| Staff invite (no SQL) | kitchen/delivery membership | | EV-STF-01 | ☐ |
| Categorías / ingredientes | In scope or N/A | | EV-CAT-01 | ☐ |
| Platos ≥1 active | Dish Library count ≥1 | | EV-DSH-01 | ☐ |
| Menú draft → publish | `weekly_menus.status=published` | | EV-MNU-01 | ☐ |
| Block: menu without dishes | DomainError `BOOTSTRAP_NO_DISHES` | | EV-NEG-01 | ☐ |
| Block: orders without menu | `MENU_LOCKED` / `BOOTSTRAP_NO_PUBLISHED_MENU` | | EV-NEG-02 | ☐ |

### Demand & fulfillment

| Step | Expected Result | Actual Result | Evidence ID | Done |
|------|-----------------|---------------|-------------|------|
| Cliente | Customer row | | EV-CUS-01 | ☐ |
| Pedido confirmado | Order `confirmed` | | EV-ORD-01 | ☐ |
| Cocina | Status advances in kitchen | | EV-KIT-01 | ☐ |
| Block: kitchen without orders | `BOOTSTRAP_NO_KITCHEN_DEMAND` | | EV-NEG-03 | ☐ |
| Reparto | `ready_for_delivery` → … | | EV-DEL-01 | ☐ |
| Block: delivery without ready | `BOOTSTRAP_NO_DELIVERY_DEMAND` | | EV-NEG-04 | ☐ |
| Entrega | `delivered` | | EV-DEL-02 | ☐ |
| Historial / audit | Audit entries visible | | EV-AUD-01 | ☐ |

### Integrity command

```bash
npm run bootstrap:verify
npm run bootstrap:verify:ci
npm run bootstrap:verify -- --live --tenant=eatclean-tenerife --json=docs/10-validation/evidence/op001/bootstrap-report.json
```

| Step | Expected Result | Actual Result | Evidence ID | Done |
|------|-----------------|---------------|-------------|------|
| Pure / CI matrix | exit 0 | | EV-VFY-01 | ☐ |
| Live snapshot + relations | report JSON written | | EV-VFY-02 | ☐ |
| Negative vitest suite | all PASS | | EV-VFY-03 | ☐ |

---

## Verdict

```text
PASS / FAIL
```

Date: _______________  
Operator: _______________  
Build / commit: _______________  
ORR: [OP001_OPERATIONAL_READINESS_REPORT.md](./OP001_OPERATIONAL_READINESS_REPORT.md)

---

## Notes

- Impossible states must remain blocked at **service** layer (see [BOOTSTRAP_STATE_MACHINE](../05-architecture/BOOTSTRAP_STATE_MACHINE.md)).
- This checklist is RI-001 evidence when filled with real artifacts (DICT-006).
