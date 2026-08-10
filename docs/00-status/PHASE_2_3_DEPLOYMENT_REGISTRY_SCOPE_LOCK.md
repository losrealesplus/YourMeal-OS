# PHASE 2.3 — DEPLOYMENT REGISTRY & MONOTENANT BINDING

## SCOPE LOCK — DOCUMENTATION ONLY

**Status:** 🔒 **SCOPE LOCKED** (product / architecture contract) · **NOT IMPLEMENTED**  
**Declared:** 2026-08-10  
**Authority:** YourMeal OS Tenant Model · Deployment → Tenant Binding Forensic · ADR 0018 · product decisions closed 2026-08-10  
**Baseline code:** `origin/main` @ `248037dfb4affe40a2c45c545ea115b820fee1e8`  
**Companions:** [YOURMEAL_OS_TENANT_MODEL_001](./YOURMEAL_OS_TENANT_MODEL_001.md) · [ADR 0018](../adr/0018-identity-membership-lifecycle.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md) · [MVP_SCOPE_LOCK_001](./MVP_SCOPE_LOCK_001.md) · Phase 2.1 / 2.2 contracts (feature branches / when present)

```text
Este documento FIJA el contrato de PHASE 2.3.
No implementa. No crea migrations. No toca src/. No certifica GREEN.
```

---

## Purpose

Definir de forma **cerrada** cómo YourMeal OS identifica un **Deployment** y cómo ese Deployment queda vinculado **server-side** a **exactamente un Tenant**.

El código posterior deberá materializar este contrato — no inventarlo.

---

## Product model (already closed)

YourMeal OS is a **duplicable SaaS platform**.

Each contracted business receives:

```text
1 Tenant
  +
1..N Deployments (per platform)
  +
a monotenant Customer Application
```

Examples:

```text
EatClean
  Tenant
    → EatClean Android
    → EatClean iOS
    → EatClean Web

Singular Street Food
  Tenant
    → Singular Android
    → Singular iOS
    → Singular Web
```

**Shared foundation. No product forks.**

---

## Constitutional rules (PHASE 2.3)

### RULE — DEPLOYMENT-TENANT BINDING

Each Customer App of YourMeal OS is **monotenant**.

A deployment belongs to **exactly one** Tenant. A Tenant may have **one or more** deployments by platform.

The binding:

```text
Deployment → Tenant
```

is administered **exclusively by SaaS Admin**.

The Customer never:

- selects a Tenant  
- enters a Tenant ID  
- enters a Tenant join code  
- modifies Tenant  
- changes Deployment  
- creates a Tenant  

Visual identity of the deployment is **not** security authority.

Resolution `Deployment → Tenant` must be performed **server-side** via a **SaaS-administered Deployment Registry**.

### RULE — TENANT CREATION

**Only SaaS Admin** may:

- create Tenant  
- configure Tenant  
- create Deployment  
- bind Deployment → Tenant  
- retire Deployment  
- change Deployment configuration when platform contract allows  

**Tenant Admin:**

- administers resources **inside** its Tenant  
- does **not** create Tenants  
- does **not** rebind Deployments  

**Customer:**

- uses the Deployment they installed  
- does not know or manipulate the Tenant concept  

### RULE — MONOTENANT CUSTOMER APP

```text
EatClean App → EatClean Tenant
```

Not:

```text
EatClean App → selector → EatClean | Singular | Other
```

### RULE — BRAND IS NOT AUTHORITY

BrandConfig is for: name, logo, colors, copy, theme, assets.

**Never:**

```text
BrandConfig.slug → authorization
frontend brand → tenant_id
```

### RULE — DEPLOYMENT IDENTITY

Signals may include: Android `applicationId`, iOS bundle ID, web hostname/domain, deployment identifier.

No client-visible signal is automatically security authority by itself.

Authority resides in the **SaaS-controlled Deployment Registry**.

### RULE — MEMBERSHIP (ADR 0018 intact)

Deployment association ≠ authorization.

```text
deployment
  → resolve Tenant (registry)
  → tenant_members
  → pending
  → staff approval
  → approved
  → ActiveTenant
```

```text
pending != access
approved = ActiveTenant
```

**Never** auto-approve because Customer join-code UX was removed.

---

## A — Data model (conceptual)

```text
Tenant
  └── Deployment(s)
```

Conceptual entity: **`tenant_deployments`**

Minimum conceptual fields:

| Field | Intent |
|-------|--------|
| `id` | Deployment record id |
| `tenant_id` | FK → `tenants.id` |
| `platform` | e.g. `android` \| `ios` \| `web` |
| `identifier` | e.g. `com.yourmealos.eatclean`, hostname |
| `is_primary` | primary deployment flag |
| `status` | e.g. `active` \| `retired` |

**Constraint:** `UNIQUE(platform, identifier)`

**Write authority:** SaaS Admin only.

```text
DISEÑO CONCEPTUAL — NO crear migration en esta misión.
```

Web may eventually reuse / extend the existing `tenant_domains` concept; mobile requires an equivalent registry surface. Exact schema is a later design decision.

---

## B — SaaS Admin UX (conceptual)

Surface: **`/saas`**

```text
Create Tenant
  → Configure Tenant
  → Create Deployment
  → Select platform
  → Define deployment identifier
  → Bind Deployment → Tenant
```

| Actor | May perform |
|-------|-------------|
| SaaS Admin | Yes |
| Tenant Admin | **No** |
| Customer | **No** |

---

## C — Runtime resolution

```text
Customer App
  → deployment identity (claim / local signal)
  → server-side registry lookup
  → tenant_id
  → authenticated association
  → tenant_members pending
```

Client must **not** send `tenant_id` as authority.

Future mechanism may use `platform + identifier` as **lookup claim** only.

Resolution is **server-side**.

**Security note (forensic):** package IDs are public in binaries. Registry lookup selects the Tenant **target**; it does **not** cryptographically prove the binary. Access remains gated by **pending → approval**. Attestation (Play Integrity / App Attest) is **future hardening**, not MVP requirement for this Scope Lock.

---

## D — Customer Auth

```text
EatClean App
  → Crear cuenta (nombre, email, password)
  → Confirmar email
  → Authenticated session
  → Deployment identity
  → Deployment Registry
  → EatClean Tenant
  → tenant_members pending
  → Staff approval
  → approved
  → ActiveTenant
  → Customer
  → Menu
  → Order
```

**Forbidden in Customer UX:**

- Tenant join code (`TJ-…`)  
- Tenant selector  
- `tenant_id` input  
- Company code as Tenant association  

---

## E — Approval

| Concept | Meaning |
|---------|---------|
| **Association** | deployment → `tenant_members.pending` |
| **Authorization** | staff approval → `approved` → ActiveTenant |

SessionBootstrap remains **read-only** w.r.t. membership creation: consumes status; does not create or approve membership.

ADR 0018 **unchanged**.

---

## F — Customer experience

Signup fields only:

- Full name  
- Email  
- Password  

UX copy (intent):

1. After signup (no session): *“Revisa tu correo.”*  
2. After association pending: *“Tu solicitud de acceso a EatClean está pendiente.”*  
3. After approval: normal Customer App  

Customer never needs to know what a Tenant is.

---

## G — Join code — SUPERSEDED FOR CUSTOMER UX

| Item | Status |
|------|--------|
| `TJ-…` in Customer `/auth` | **SUPERSEDED** — cancelled / frozen for Customer UX |
| StorageProvider + pending TJ (Phase 2.2.5) | **SUPERSEDED / FROZEN** — do not implement |
| Customer tenant selector / join-code input | **SUPERSEDED** |

**Do not delete yet** (KEEP INTERNAL until later deprecation decision):

- `tenants.join_code`  
- `generate_tenant_join_code`  
- `resolve_tenant_join_code`  
- `request_tenant_association_by_join_code`  

Join Code ≠ Customer UX. May remain for administrative / invite / ops paths if needed later.

---

## H — Phase 2.2 relationship

| Model | Status |
|-------|--------|
| Phase 2.2 original: Customer → Join Code → Tenant | **SUPERSEDED for Customer UX** |
| Phase 2.3: Customer App Deployment → Registry → Tenant → Membership | **AUTHORITATIVE for Customer cold association** |

**Do not:**

- reopen Phase 2.2 as Customer join-code path  
- patch Phase 2.2 with StorageProvider + TJ persistence  
- transport TJ across signup / callback  

Phase 2.2 value that **remains**: pending membership + staff approval + SessionBootstrap ActiveTenant gate (ADR 0018). That semantics is **retained**; only the **Customer association input** (join code) is superseded.

### Phase numbering note (explicit, not silent)

Prior constitution draft listed:

```text
Phase 2.3+ session / menu / order / OPPO
```

**This Scope Lock REDEFINES Phase 2.3** as:

```text
PHASE 2.3 = Deployment Registry & Monotenant Binding
```

Organism unlock after approved membership (menu / order / device E2E) remains required work but is **not** this Phase 2.3 number. Track under later Phase 2.x / MVP tracks after binding exists.

---

## I — Security model

| # | Attack | Expected result |
|---|--------|-----------------|
| 1 | Customer sends arbitrary `tenant_id` | Rejected / ignored (not authority) |
| 2 | Customer changes BrandConfig | Does not change Tenant |
| 3 | Customer declares another appId claim | At minimum: no automatic access; membership still pending if any |
| 4 | Customer INSERT `tenant_members` | Blocked by RLS / permissions |
| 5 | Tenant Admin creates Tenant | Forbidden |
| 6 | Tenant Admin rebinds Deployment | Forbidden |
| 7 | SaaS Admin creates Tenant + Deployment | Allowed |
| 8 | SaaS Admin binds Deployment → Tenant | Allowed |

---

## J — EatClean (first real case)

| Item | Value |
|------|--------|
| Tenant name | EatClean Tenerife |
| `tenant_id` | `7823e85a-986f-401f-9bbe-e4e431ff3be1` |
| Android | `com.yourmealos.eatclean` |
| iOS | `com.yourmealos.eatclean` |
| Web | future hostname / domain (`tenant_domains` unused today) |

```text
com.yourmealos.eatclean
  → Deployment Registry
  → EatClean tenant_id
```

**Do not** treat `BrandConfig.slug = eatclean` as authority (also ≠ DB slug `eatclean-tenerife`).

---

## K — Singular Street Food (second conceptual case)

```text
Singular Street Food
  → new Tenant (SaaS Admin)
  → new Deployment(s) with own applicationId / bundle / domain
  → same foundation / codebase
```

No fork.

---

## L — Duplicability

```text
YourMeal OS Foundation
  + Tenant
  + Deployment (registry)
  + BrandConfig (presentation)
  → App
```

For: EatClean · Singular Street Food · Future Tenant N  

Without: `if (eatclean)` · product forks · duplicated backend logic.

---

## M — Provisioning (future)

```text
SaaS Admin
  → Create Tenant
  → Configure Tenant
  → Create Deployment
  → Bind Deployment → Tenant
  → Branding
  → Build
  → Store publication
```

Later automatable. **Not implemented in this mission.**

---

## N — Current GAP (PHASE 2.3)

**Exists today:**

- Tenant (`tenants`)  
- Membership (`tenant_members` + ADR 0018 semantics in source)  
- BrandConfig / Capacitor `appId` (presentation / store identity)  
- Join-code infrastructure (internal; Customer path superseded)  

**Missing (this phase):**

- Trusted Deployment Registry  
- Deployment → Tenant binding (server-side)  
- Deployment association RPC (no client `tenant_id`)  
- SaaS Deployment management UX  

---

## O — Implementation boundary

### MUST NOT CHANGE (when implementing later)

- ADR 0018 pending/approved semantics  
- RLS customer isolation  
- SaaS-only Tenant creation  
- `ensure_individual_customer` semantics (post approved tenant context)  
- Customer tenant isolation  
- Menu / Order domain  
- MVP-02 Customer Bulk (no rename, no jump ahead)  
- Production / Nutrition tracks  
- Blind deletion of join-code migrations  

### FUTURE IMPLEMENTATION WILL REQUIRE

- Deployment Registry schema + RLS  
- SaaS binding UX  
- Server-side resolution  
- Deployment association RPC  
- Customer auth wiring (post-session; no TJ)  
- Tests (matrix below)  
- Provisioning integration  

**All of the above are OUT OF THIS DOCUMENTATION MISSION.**

---

## P — Test matrix (acceptance criteria)

| ID | Criterion |
|----|-----------|
| T1 | SaaS Admin can create Tenant |
| T2 | SaaS Admin can create Deployment |
| T3 | SaaS Admin can bind Deployment → Tenant |
| T4 | Tenant Admin cannot create Tenant |
| T5 | Tenant Admin cannot rebind Deployment |
| T6 | Customer signup does **not** show Tenant join code |
| T7 | Customer signup does **not** request `tenant_id` |
| T8 | EatClean deployment resolves EatClean Tenant |
| T9 | Singular deployment resolves Singular Tenant |
| T10 | Customer association creates **pending** |
| T11 | Pending does **not** create ActiveTenant |
| T12 | Staff approval → approved |
| T13 | Approved → ActiveTenant |
| T14 | Customer can create/obtain customer profile (post approved context) |
| T15 | Customer can view menu |
| T16 | Customer can create order |
| T17 | Refresh keeps context |
| T18 | Restart keeps context |
| T19 | Modified BrandConfig does not change Tenant |
| T20 | Arbitrary frontend `tenant_id` does not grant other-Tenant access |
| T21 | Deployment A does not resolve Tenant B |
| T22 | No cross-tenant access |

---

## Q — Documentation relationships

| Document | Relationship |
|----------|----------------|
| [YOURMEAL_OS_TENANT_MODEL_001](./YOURMEAL_OS_TENANT_MODEL_001.md) | Constitution; hosts RULE DEPLOYMENT-TENANT BINDING |
| Phase 2 Customer Self-Registration | Cold signup does not create Tenants; association target = existing Tenant |
| Phase 2.1 Tenant Join Code | KEEP INTERNAL; Customer UX superseded |
| Phase 2.2 Cold Tenant Association | pending/approval **retained**; Customer join-code input **SUPERSEDED** |
| ADR 0018 | Membership lifecycle unchanged |
| [MVP_SCOPE_LOCK_001](./MVP_SCOPE_LOCK_001.md) | **MVP-02 = Customer Bulk** — do not rename; do not advance ahead of working cold association |

```text
MVP-02 = Customer Bulk
Phase 2.3 = Deployment Registry & Monotenant Binding
```

---

## R — Out of scope for this mission

- Any `src/` change  
- Any migration / RLS change  
- RPC implementation  
- APK / build  
- Commit / push / PR  

---

## Changelog

| Date | Note |
|------|------|
| 2026-08-10 | Initial Scope Lock (docs-only). Customer join-code path SUPERSEDED. Phase 2.3 redefined as Deployment Registry. |

---

## Final verdict

```text
READY FOR PHASE 2.3 DESIGN

CLOSED:
  Deployment → Tenant model
  SaaS Admin authority
  Customer monotenant
  pending/approved intact (ADR 0018)
  Join Code Customer UX = SUPERSEDED

OPEN FOR LATER DESIGN/IMPL (not blockers of this lock):
  Exact schema vs tenant_domains reuse
  Exact RPC name/signature
  Attestation hardening
  Post-binding organism E2E track numbering

NO CODE · NO MIGRATION · NO BUILD · NO COMMIT · NO PR
```
