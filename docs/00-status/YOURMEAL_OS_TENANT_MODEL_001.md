# YOURMEAL OS — TENANT MODEL 001

**Status:** 📝 **PROPOSAL** — Architecture / Product Constitution · awaiting human approval  
**Declared:** 2026-08-10  
**Layer:** Product + Architecture · permanent invariants  
**Baseline code:** `origin/main` @ `248037dfb4affe40a2c45c545ea115b820fee1e8`  
**Companions:** [MVP_SCOPE_LOCK_001](./MVP_SCOPE_LOCK_001.md) · [PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK](./PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK.md) · [ADR 0003](../adr/0003-multi-tenant.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md) · [ADR 0015](../adr/0015-b2b-b2c-customer-model.md) · [ADR 0018](../adr/0018-identity-membership-lifecycle.md) · [TENANT_OPERATIONAL_AUTONOMY](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md) · Phase 2.1 Tenant Join Code contracts *(feature branches / when present — Customer UX path SUPERSEDED)*

```text
Este documento fija el MODELO MAESTRO de Tenant / SaaS / monotenant deployment.
No implementa. No certifica GREEN. No renumera MVP-xx.
```

---

## Purpose

YourMeal OS is a **reusable SaaS operating system** for food-service / catering / meal businesses.

**EatClean is the FIRST TENANT / FIRST REAL DEPLOYMENT** — not a special-case codebase.

The same foundation must later provision:

- EatClean  
- Singular Street Food  
- future catering / meal businesses  

Each contracted business receives **its own Tenant** and a **tenant-branded monotenant application deployment**.

---

## SaaS Platform Model

```text
YOURMEAL OS = multi-tenant SaaS PLATFORM
Customer Application deployment = MONOTENANT
```

```text
YourMeal OS Platform
    ├── Tenant A → App A (ONLY Tenant A)
    ├── Tenant B → App B (ONLY Tenant B)
    └── Tenant C → App C (ONLY Tenant C)
```

Correct description:

> **YourMeal OS is a multi-tenant SaaS platform whose customer deployments are monotenant.**

Do **not** describe a tenant application as containing multiple business tenants.

---

## Tenant Definition

One Tenant = one **contracted business** of YourMeal OS.

| Tenant | Example |
|--------|---------|
| A | EatClean |
| B | Singular Street Food |
| C… | Future businesses |

Each Tenant owns its operational boundary: identity, branding, configuration, customers, companies, suppliers, employees, departments, menus, dishes, orders, production, delivery, users, preferences, settings.

**Tenant data must never cross Tenant boundaries.**

---

## SaaS Admin

**LEVEL 0 — YourMeal OS SaaS Administration**

- Initially: platform founder/operator  
- Above Tenant Administration  
- Manages: Tenant create/provision/activate/suspend, SaaS-level config, deployment/provisioning, future subscription/billing, future ownership transfer of **Tenant Admin** (not SaaS ownership)

Evidence today: `saas_admin` role · `/saas` · `createTenant` / `createCompanyAdmin` · RLS `tenants_admin_write` · platform owners bootstrap.

---

## Tenant Admin

**LEVEL 1 — Tenant Administration**

Examples:

- EatClean → Tenant Admin (e.g. Adolfo Álvarez)  
- Singular Street Food → Tenant Admin (e.g. Isabella Hernández)  

Manages **inside** the Tenant: customers, companies, suppliers, employees, departments, menus, dishes, orders, production, operational config, tenant users/settings.

**TENANT ADMIN MUST NEVER CREATE A TENANT.**

Evidence today: `company_admin` (+ ops staff roles) operate `/admin` · user provisioning · branding (partial) · join-code generate (**internal/ops only** — not Customer UX).

---

## Tenant Creation Authority

```text
SaaS ADMIN → CREATE / PROVISION TENANT → TENANT
```

**Never:**

```text
TENANT → CREATE TENANT → TENANT
```

This is a **permanent architectural invariant** (RULE 001 / RULE 002).

Evidence: app path + RLS already enforce saas_admin-only tenant INSERT.

---

## Tenant Operational Boundary

Once a Tenant exists, operational entities are children of that Tenant:

Customers · Companies · Suppliers · Employees · Departments · Menus · Dishes · Orders · Production · Delivery · Addresses · Preferences · …

Everything resolves to the **Tenant boundary**.

A Tenant may create/manage operational entities **inside its own boundary** but never another Tenant (RULE 015).

---

## Monotenant Deployment Model

Each Tenant receives a branded application deployment (name, logo, branding, configuration, departments, operational data) for App Store / Play Store.

**EatClean is the first Tenant and reference deployment.**

**Future tenants such as Singular Street Food use the same YourMeal OS foundation with separate Tenant configuration, branding and operational data.**

EatClean-specific information must be **TENANT DATA / TENANT CONFIGURATION**, not hardcoded platform architecture (RULE 011 / RULE 012).

**Current materialization:** Capacitor `com.yourmealos.eatclean` + bundled BrandConfig — **PARTIAL** vs this constitution (see Gaps).

---

## Tenant Isolation

Isolation is a **security invariant** — not frontend-only filtering.

Required:

- `tenant_id` boundaries  
- authenticated identity  
- durable membership  
- role authorization  
- RLS  
- server-side validation  
- no arbitrary tenant selection  
- no cross-tenant reads/writes  

Forbidden:

- client-side tenant spoofing  
- `USING(true)` for tenant data  
- disabling RLS  
- service-role as normal app mechanism  
- arbitrary `tenant_id` without server authorization  

Evidence: ADR 0003 · RLS helpers (`is_tenant_member` approved-only) · **gap:** SessionBootstrap still omits `status = approved` filter.

---

## Customer Model

**Customer is NOT a Tenant.** Customer **belongs to** an existing Tenant.

```text
TENANT → CUSTOMER
```

A Customer cannot: create a Tenant · change Tenant arbitrarily · access another Tenant · select arbitrary client `tenant_id`.

---

## Customer Self-Registration

```text
COLD SIGNUP (monotenant app)
  → email confirmation → authenticated session
  → Deployment Registry resolves EXISTING Tenant (server-side)
  → DURABLE MEMBERSHIP (pending → staff approval → approved)
  → ActiveTenant → CUSTOMER IDENTITY → CUSTOMER APP
```

**Phase 2 Customer Self-Registration + Tenant Association does not create Tenants.**

The Tenant already exists (SaaS-provisioned). The **Deployment** of the Customer App determines which Tenant — the Customer never selects or types a Tenant.

Current code: `/auth` creates Auth + profile; **no** trusted deployment → tenant binding yet → `tenantId = null` → menu/orders gated (**BLOCKER-003** / Phase 2.3 GAP).

| Increment | Customer association | Status |
|-----------|----------------------|--------|
| Phase 2.1 `tenant_join_code` | Internal primitive | **MERGED** (#427) — KEEP INTERNAL |
| Phase 2.2 join-code Customer UX | Customer types `TJ-…` | **SUPERSEDED for Customer UX** |
| Phase 2.2 pending / approval semantics | ADR 0018 | **RETAINED** |
| **Phase 2.3 Deployment Registry** | Deployment → Tenant server-side | **SCOPE LOCKED** — not implemented |

### Customer join-code path — SUPERSEDED

```text
Customer → TJ-… / StorageProvider+TJ / tenant selector
  = SUPERSEDED · CANCELLED · FROZEN for Customer UX
```

Do **not** delete join-code migrations/RPCs blindly. Keep internal until a later deprecation decision. See [PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK](./PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK.md).

---

## Department Model

Departments are **tenant-configurable** in product intent (Admin, Kitchen, Production, Logistics, Delivery, Accounting, Support, …).

Not every Tenant needs the same structure.

**Current code:** Ops department catalogue is largely **hardcoded** EatClean-shaped (`operations-departments.ts`). B2B organizational units are a separate track. Gap vs constitution: **PARTIAL / MISSING** configurability.

---

## Operational Model

Minimum useful organism:

```text
CUSTOMER → ORDER → TENANT DEPARTMENTS
  → PRODUCTION → DELIVERY / COMPLETION → CUSTOMER
```

Menus, orders, work plan (Hoja de Producción), production belong to the Tenant.

Customer App is the customer-facing entry into the Tenant — not an isolated product.

---

## Branding / Configuration

Tenant configuration (eventual): name, legal identity, logo, branding, locale, currency, timezone, units, departments, modules, operational settings.

Authority must be explicit: some SaaS Admin · some Tenant Admin.

ADR 0014: Platform owns capability · Tenant owns experience.

**Gap:** Tenant-Managed branding (company_admin) vs `tenants` write RLS still saas_admin-only — **CONTRADICTORY**.

---

## Duplication / Provisioning

Primary product requirement: **duplicability**.

```text
YourMeal OS → Tenant Config → Branding → Modules → Build → Store Deployment
  → App A (EatClean)
  → App B (Singular Street Food)
```

EatClean must **not** become a special-case fork.

---

## Ownership Transfer

Future capability (architectural slot):

```text
SaaS Admin provisions Tenant
  → designates Tenant Admin
  → SaaS Admin remains platform-level only
```

Transfers **who administers the Tenant**, not which Tenant owns the data (RULE 013 / RULE 014).

**Current:** seed/config platform owners + `createCompanyAdmin` · **no** first-class ownership-transfer product.

---

## Role Hierarchy

Conceptual (verify names against code — do not invent):

| Level | Concept | Current materialization (approx.) |
|-------|---------|-----------------------------------|
| 0 | SaaS Administration | `saas_admin` (+ platform owners) |
| 1 | Tenant Administration | `company_admin` |
| 2 | Tenant Departments / Staff | kitchen, delivery, production, … |
| 3 | Customer | `customer` |

Do not invent new role names without checking `app_role` / RBAC docs.

---

## Architectural Invariants

| ID | Rule |
|----|------|
| **RULE 001** | Only SaaS Administration creates Tenants. |
| **RULE 002** | A Tenant cannot create another Tenant. |
| **RULE 003** | One contracted business = one Tenant. |
| **RULE 004** | Each Tenant application deployment is monotenant. |
| **RULE 005** | Tenant data never crosses Tenant boundaries. |
| **RULE 006** | Customer belongs to an existing Tenant. |
| **RULE 007** | Customer signup cannot create a Tenant. |
| **RULE 008** | Tenant association must be durable and server-authorized. |
| **RULE 009** | Tenant identity cannot be spoofed from client-side input. |
| **RULE 010** | Tenant isolation enforced by backend/DB/RLS, not merely frontend. |
| **RULE 011** | Tenant-specific branding/config = data/configuration, not hardcoded architecture. |
| **RULE 012** | EatClean is the reference implementation for future duplication. |
| **RULE 013** | Future Tenant Admin ownership transfer must be architecturally possible. |
| **RULE 014** | SaaS Admin remains above Tenant Administration. |
| **RULE 015** | A Tenant may manage entities inside its boundary but never another Tenant. |
| **RULE 016** | **DEPLOYMENT-TENANT BINDING** — see literal rule below. |

### RULE 016 — DEPLOYMENT-TENANT BINDING (literal)

> Cada Customer App de YourMeal OS es monotenant. Un deployment pertenece a un único Tenant y un Tenant puede tener uno o varios deployments según plataforma. El binding Deployment → Tenant es administrado exclusivamente por SaaS Admin. El Customer nunca selecciona, proporciona ni modifica el Tenant al que pertenece la aplicación. La identidad visual del deployment no constituye autoridad de seguridad; la resolución Deployment → Tenant debe realizarse server-side mediante un registro administrado por SaaS.

English (same authority):

> Each Customer App of YourMeal OS is monotenant. A deployment belongs to a single Tenant; a Tenant may have one or more deployments by platform. Deployment → Tenant binding is administered exclusively by SaaS Admin. The Customer never selects, supplies, or modifies the Tenant of the application. Visual identity is not security authority; Deployment → Tenant resolution must be server-side via a SaaS-administered registry.

---

## Relationship to MVP_SCOPE_LOCK_001

**MVP-02 Customer Bulk remains part of the original MVP_SCOPE_LOCK_001.**

This document does **not** renumber MVP-xx.

| Document | Owns |
|----------|------|
| MVP_SCOPE_LOCK_001 | MVP-01… construction order · Bulk · Menu · Orders · Production · platforms |
| THIS DOCUMENT | SaaS / Tenant / monotenant constitution · permanent invariants |

Implementation priority alignment:

1. Architecture lock (this)  
2. **Phase 2.3** — Deployment Registry & Monotenant Binding ([Scope Lock](./PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK.md))  
3. Cold signup association via deployment (post–Phase 2.3 design/impl)  
4. **MVP-02** — Customer Bulk  
5. Menu Core · Order Core · Work Plan · Production · Bulks · Android · iOS  

---

## Relationship to Phase 2

**Phase 2 Customer Self-Registration + Tenant Association does not create Tenants.**

It associates a Customer with an **existing** Tenant determined by the **Deployment**, not by Customer-supplied join code.

| Increment | Status |
|-----------|--------|
| Phase 2.1 `tenant_join_code` | **MERGED** (#427) — KEEP INTERNAL |
| Phase 2.2 Customer join-code UX | **SUPERSEDED** for Customer UX |
| Phase 2.2 pending → approved → ActiveTenant | **RETAINED** (ADR 0018) |
| **Phase 2.3 Deployment Registry & Monotenant Binding** | **SCOPE LOCKED** — design/impl next · [Scope Lock](./PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK.md) |
| Later Phase 2.x / MVP — menu · order · device E2E after ActiveTenant | Deferred (was previously drafted as “Phase 2.3+”; **renumbered** — see Scope Lock §H) |

**Explicit renumbering (not silent):** a prior draft of this constitution listed “Phase 2.3+ session / menu / order / OPPO”. **Phase 2.3 now means Deployment Registry & Monotenant Binding.** Organism unlock after approval is later work, not this Phase 2.3 number.

---

## Relationship to MVP-02 Customer Bulk

Bulk creates many customers **inside** an existing Tenant.

Depends on Customer Core GREEN (done) and should not jump ahead of a working cold association path for the Customer App organism.

---

## Explicit statements (locked wording)

1. **MVP-02 Customer Bulk remains part of the original MVP_SCOPE_LOCK_001.**  
2. **Phase 2 Customer Self-Registration + Tenant Association does not create Tenants.**  
3. **Only SaaS Administration can create/provision Tenants.**  
4. **Each Tenant deployment is monotenant.**  
5. **Tenant data must never cross Tenant boundaries.**  
6. **EatClean is the first Tenant and reference deployment.**  
7. **Future tenants such as Singular Street Food use the same YourMeal OS foundation with separate Tenant configuration, branding and operational data.**  
8. **RULE 016 — Deployment → Tenant binding is SaaS-only and server-side; BrandConfig is not authority.**  
9. **Customer join-code (`TJ-…`) path is SUPERSEDED for Customer UX.**  
10. **Phase 2.3 = Deployment Registry & Monotenant Binding** (not menu/order/device numbering).  

---

## Out of scope for this document

Does **not** authorize: schema/RLS/auth/signup changes · Tenant Admin role rename · ownership transfer implementation · billing · store automation · Menu/Bulk/Production redesign.

Those require separate implementation missions **after** this constitution is approved.

---

## Changelog

| Date | Note |
|------|------|
| 2026-08-10 | Initial constitution proposal (docs-only · no implementation · no commit) |
| 2026-08-10 | RULE 016 DEPLOYMENT-TENANT BINDING · Customer join-code SUPERSEDED · Phase 2.3 = Deployment Registry Scope Lock · docs-only |
