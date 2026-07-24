# AUD-001 · Runtime Deployment Audit

**Tipo:** Auditoría (sin cambios funcionales)  
**Fecha:** 2026-07-24  
**Auditor:** Cursor Agent  
**Motivo:** Campo Lovable no refleja el bootstrap OP-001…OP-001.2 pese a PR #54 “merged”

---

## Objective

Determinar por qué la aplicación desplegada en Lovable **no** permite operar el bootstrap, sin modificar features.

---

## Answers (auditor checklist)

### 1. ¿El commit de Lovable es el merge de PR #54?

**No.**

| Ref | SHA | Notes |
|-----|-----|-------|
| PR #54 merge | `73c78cc3d16bf90ff642ccf83c771bec3fde98aa` | Merged **into** `cursor/op-001-1-bootstrap-validation-f54a`, **not** into `main` |
| Stack tip (OP-001.1+) | `432d5838e598b0bd9b8a62ab728a7b137709b7d2` | Includes FOPEBA acta |
| `origin/main` (GitHub) | `67bf0abbce474c2f92e40a858cddfa16044466f6` | **Does not contain** OP-001 / #54 |
| Ancestor check | `73c78cc` ⊆ `main`? | **NO** |
| Ancestor check | `d658ad0` (OP-001) ⊆ `main`? | **NO** |

**Conclusion Q1:** PR #54 is merged on a **feature branch stack**, not on the branch Lovable publishes as production/preview (`main`). Escenario **B + C**.

---

### 2. ¿Existe `/saas` en runtime?

**Sí (ruta presente en build desplegada).**

- HTTP `https://eatcleanapp.lovable.app/saas` → **200** (SPA shell)
- Bundle markers: `/saas`, `saas/tenants` present in JS chunks
- Repo (`main` and stack): `src/routes/_authenticated/saas*.tsx` including tenants / company-admin

Existence of the route ≠ successful SaaS operation (needs `saas_admin` + working server fns).

---

### 3. ¿`SaasOpsEntry` está en la build desplegada?

**Sí (i18n + entry strings presentes).**

| Marker in deployed `index-*.js` | Result |
|--------------------------------|--------|
| `saasEntryLabel` | FOUND |
| `Centro de Operaciones YourMeal OS` | FOUND |
| `Administración de la plataforma` | FOUND |
| Symbol name `SaasOpsEntry` | MISS (minified; expected) |

**Mount point (repository):** only `admin.index.tsx` → `<SaasOpsEntry />` when `useAuth().isSaasAdmin`.

**Visibility rule:** component returns `null` if `!isSaasAdmin`. Pure `saas_admin` home is `/saas` via `homePathForRoles`, so they may **never see** SaasOpsEntry on `/admin` unless they navigate there. Hybrid (`operations_manager` + `saas_admin`) lands `/admin` and should see it.

---

### 4. ¿“Centro de Operaciones” llama a `navigate("/admin")`?

**En repositorio (main = desplegable): sí, vía helper — no hardcode ciego.**

`BrandLeafMark` → `decideOperationsCenterEntry`:

| Session | Destination |
|---------|-------------|
| No session / no staff | `/auth/admin?returnTo=/admin` |
| Pure `saas_admin` | `/saas` |
| Staff / hybrid | `/admin` (or kitchen/delivery sole workspace) |

Mounted on: `auth.tsx`, `app.index.tsx` (customer home). **Not** on public landing `/` as a labeled ops entry (landing only has login CTA).

---

### 5. ¿El usuario de prueba es `saas_admin`?

**No verificable desde este agente** (sin service role / session del usuario de campo).

Required for platform ops:

```sql
user_roles.role = 'saas_admin' AND tenant_id IS NULL
```

If the tester is only `company_admin` / customer:

- `SaasOpsEntry` hidden  
- `/saas` `beforeLoad` → `assertSaasRoute` rejects  
- Cannot create Tenant / Company Admin from UI  

**Action for operator:** confirm role in Supabase before blaming UI.

---

### 6. ¿Hay membership de tenant?

**No verificable aquí.** Secondary gate for `/admin` tenant ops and SaaS “back to Ops Center” link. Pure `saas_admin` without membership is valid for `/saas` provisioning.

---

## Runtime build identity

| Field | Value |
|-------|--------|
| URL probed | `https://eatcleanapp.lovable.app/` |
| Probe time (UTC) | 2026-07-24 ~20:12 |
| `x-deployment-id` | `2dbda8de3046f58503892ae707fdedbe9b88e85de92cdd515f1527d58b363c3d` |
| Main asset | `/assets/index-3ZkFHPKE.js` (~542 KB) |
| Git SHA embedded | **Not found** in shell (no public commit stamp in HTML) |
| Inferred code lineage | **`main`-class** (placeholder dish copy present; OP-001 markers absent) |

---

## Repository versions

| Surface | SHA | Date (UTC) |
|---------|-----|------------|
| Lovable-facing `main` | `67bf0ab` | 2026-07-24 19:18 |
| OP-001 restore | `d658ad0` | on feature branch only |
| PR #54 merge | `73c78cc` | into OP-001.1 branch |
| Stack tip | `432d583` | FOPEBA acta absorbed |

**Distance:** `main..OP-001.1` ≈ **10 commits / ~62 files** (bootstrap UI, seed, integrity, evidence).

---

## Runtime routes (repo + deploy shell)

| Route | In repo `main` | In deploy chunks | Notes |
|-------|----------------|------------------|-------|
| `/admin` | Yes | Yes | Ops center |
| `/saas` | Yes | Yes | Platform console |
| `/driver` | Yes | (SPA) | Exists in route tree |
| `/admin/dishes` | Yes | Yes | **Placeholder on main/deploy** |
| `/admin/menus` | Yes | Yes | **Placeholder + FF-gated on main** |

---

## Feature flags (main = deploy lineage)

From `pilot-feature-flags.ts` on `main`:

- `admin_module_dishes` / `admin_module_menus` default **OFF** (missing key → false)
- Nav items for dishes/menus **hidden** unless flag enabled
- OP-001 stack **removes** that gate; **not on main** → deploy still gated

---

## Runtime vs Repository diff (critical)

| Capability | Stack OP-001.1+ (GitHub branch) | `main` / Lovable deploy (inferred) |
|------------|----------------------------------|-------------------------------------|
| Dish Library real UI | ✅ DishService CRUD | ❌ Placeholder *“Module 01…”* (**FOUND in deploy JS**) |
| Weekly menu publish | ✅ WeeklyMenuService | ❌ Placeholder + FF |
| Staff invite no SQL | ✅ `inviteTenantStaff` | ❌ Read-only users (pre-OP-001) |
| Integrity guards | ✅ bootstrap-integrity | ❌ Absent (`BOOTSTRAP_*` MISS in deploy) |
| `npm run seed` | ✅ | ❌ Not on main |
| SaasOpsEntry / `/saas` tenants UI | ✅ | ✅ Present on main/deploy |
| PR #54 on publish branch | ✅ on feature stack | ❌ **not on main** |

**Deploy JS proof (OP-001 absent):**

```text
FOUND: Dish Library — Module 01     ← main placeholder copy
MISS:  WeeklyMenuService
MISS:  inviteTenantStaff
MISS:  BOOTSTRAP_NO_DISHES
```

---

## Root cause

### Primary (blocking certification)

**Escenario B + C — Deployment target mismatch.**

```text
PR #54 “merged”
    ↓
into cursor/op-001-1-bootstrap-validation-f54a
    ↓
NOT into main
    ↓
Lovable serves main-class build (deployment-id 2dbda8de…)
    ↓
Field user never receives OP-001 bootstrap surfaces
```

The repository can be “PASS” on a branch while the **product the user opens** remains pre-bootstrap for dishes/menus/seed/integrity.

### Secondary (can still break field even after merge to main)

1. **Role:** tester without `saas_admin` → no SaaS entry / cannot provision.  
2. **SaasOpsEntry placement:** only on `/admin`; pure saas_admin homes to `/saas` (entry on `/saas` itself is the tenants nav — OK if they land there).  
3. **Feature flags on main:** dishes/menus nav hidden until OP-001 lands.  
4. **Server fn env:** tenant/company-admin create needs service role in Lovable Cloud — separate from missing commit.

---

## Missing modules on runtime (vs OP-001 intent)

- Real Dish Library UI  
- Weekly menu write/publish  
- Tenant staff invite  
- Bootstrap integrity service + banners  
- Day-0 `npm run seed` path in published tree  

Present on runtime (main-class): `/saas` shell, tenants/company-admin **code**, SaasOpsEntry strings, BrandLeafMark decision helper — but field success still depends on roles + merge.

---

## FOPEBA implication

| Layer | Status |
|-------|--------|
| Repository engineering (stack) | Still solid |
| Deployed product (Lovable field) | **NOT OPERATIONAL for OP-001 DoD** |
| CHECK-IT 05 | **Do not start** until stack is on the publish branch and field re-probed |

```text
Bootstrap Engineering (repo stack)     PASS
Bootstrap Evidence (field runtime)     FAIL — wrong deploy target / pre-OP-001 build
```

---

## Recommended next actions (no feature coding)

1. **Merge the OP-001 stack into `main`** (or whatever branch Lovable is connected to).  
2. Confirm Lovable rebuild picks up new `x-deployment-id`.  
3. Re-probe deploy JS: must **lose** `Dish Library — Module 01` placeholder; must gain menu/staff paths.  
4. Confirm tester `saas_admin` row.  
5. Only then resume Day-0 checklist → ORR PASS → CHECK-IT 05.

---

## Verdict

```text
AUD-001: FAIL (runtime ≠ repository publish intent)
```

**Root cause:** PR #54 never landed on `main`; Lovable serves a `main`-class build that still ships Dish Library placeholder and lacks OP-001 bootstrap modules.

**Not a proof that OP-001 code is wrong.**  
**Proof that field evidence cannot certify OP-001 until deploy sync is fixed.**
