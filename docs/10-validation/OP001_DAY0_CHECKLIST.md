# OP-001 Day-0 Checklist

**Purpose:** Reproducible evidence that a clean deployment becomes an operational tenant end-to-end.  
**Linked:** OP-001 · OP-001.1 · RI-001 / CHECK-IT 05  
**Command helpers:** `npm run seed` · `npm run bootstrap:verify`

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

### Platform (SaaS Admin)

- [ ] Login as seeded `saas_admin`
- [ ] Lands on `/saas`
- [ ] Create Tenant
- [ ] Activate Tenant
- [ ] Create / provision Company (tenant company account, if used)
- [ ] Company Settings (branding / locale as available)
- [ ] Invite Company Admin
- [ ] Assign Roles (`operations_manager`, `kitchen`, `delivery` as needed)

### Tenant (Company Admin)

- [ ] Login as Company Admin → `/admin`
- [ ] Staff invite (kitchen / delivery) — without SQL
- [ ] Categorías / ingredientes (if in scope for tenant; else N/A)
- [ ] Platos — create ≥1 active dish
- [ ] Menú semanal — draft → slots → **publish**
- [ ] Integrity: app blocks menu without dishes
- [ ] Integrity: app blocks orders without published menu

### Demand & fulfillment

- [ ] Cliente (customer account)
- [ ] Pedido (program + confirm against published week)
- [ ] Producción / Cocina — only after confirmed orders
- [ ] Ruta / Reparto — only after ready_for_delivery
- [ ] Entrega → `delivered`
- [ ] Historial / audit visible

### Integrity command

```bash
npm run bootstrap:verify
npm run bootstrap:verify -- --live --tenant=eatclean-tenerife
```

- [ ] Pure matrix PASS
- [ ] Live snapshot recorded (attach output below)

---

## Evidence log

| Step | Actor | Result | Evidence (screenshot / log / URL) |
|------|-------|--------|-----------------------------------|
| seed | CLI | | |
| Login SaaS | saas_admin | | |
| Tenant | saas_admin | | |
| Company Admin | saas_admin | | |
| Dishes | company_admin | | |
| Menu publish | company_admin | | |
| Order | customer | | |
| Kitchen | kitchen | | |
| Delivery | delivery | | |
| Completed | — | | |

---

## Verdict

```text
PASS / FAIL
```

Date: _______________  
Operator: _______________  
Build / commit: _______________  

---

## Notes

- Impossible states must remain blocked (see [BOOTSTRAP_STATE_MACHINE](../05-architecture/BOOTSTRAP_STATE_MACHINE.md)).
- This checklist is RI-001 evidence when filled with real artifacts (DICT-006).
