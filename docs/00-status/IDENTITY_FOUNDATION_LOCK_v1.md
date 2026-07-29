# IDENTITY FOUNDATION LOCK · v1

**Documento:** `IDENTITY_FOUNDATION_LOCK_v1.md`  
**Fecha:** 2026-07-29  
**Nivel:** Decision (gobernanza de plataforma · capa Identity)  
**Estado:** **LOCKED**  
**Version:** **v1**  
**Knowledge Lifetime:** Iteration *(acta inmutable al cierre)*  
**No es:** rediseño de Auth · permiso para MFA/SSO/SCIM “ya” · apertura de Multi-Membership

**Prerrequisitos / evidencia de cierre:**

| Artefacto | Rol |
|-----------|-----|
| [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) | Auth Layer Frozen (sesión · OAuth gated · no RBAC redesign) |
| [ADR 0018](../adr/0018-identity-membership-lifecycle.md) · [PR #90](https://github.com/losrealesplus/YourMeal-OS/pull/90) | Lifecycle Identity → Membership → Role · Provisioning |
| [ADR 0019](../adr/0019-identity-hardening-v1.md) · [PR #91](https://github.com/losrealesplus/YourMeal-OS/pull/91) | Hardening · identity_events · Timeline · soft-archive · consistency |
| [IDENTITY_HARDENING_V1_CLOSED](./IDENTITY_HARDENING_V1_CLOSED.md) | Checklist P1–P10 |
| Docs arquitectura | [IDENTITY_LIFECYCLE](../05-architecture/IDENTITY_LIFECYCLE.md) · [MEMBERSHIP_LIFECYCLE](../05-architecture/MEMBERSHIP_LIFECYCLE.md) · [IDENTITY_AUDIT](../05-architecture/IDENTITY_AUDIT.md) · [USER_PROVISIONING](../05-architecture/USER_PROVISIONING.md) |

> Si ADR 0019 / docs de hardening aún viven solo en PR #91, el Lock entra en vigor al merge de #91. La declaración conceptual ya es **LOCKED**.

---

## Declaración oficial

```text
IDENTITY FOUNDATION LOCK

Status:
  LOCKED

Version:
  v1

Scope:
  ✓ Identity
  ✓ Profile
  ✓ Membership
  ✓ Invitation
  ✓ Provisioning
  ✓ Approval
  ✓ Role Assignment
  ✓ Identity Audit
  ✓ Activity Timeline
  ✓ Consistency Checks
  ✓ Soft Archive

Out of Scope:
  - Multi Membership
  - Multi Tenant Session
  - SSO
  - SCIM
  - Impersonation

Rule:
  Future evolution may add capabilities.
  Future evolution must not redesign the Identity architecture
  without operational evidence.
```

---

## Qué significa LOCKED

| Significa | No significa |
|-----------|--------------|
| La arquitectura base Identity **no se rediseña** | Que nunca se añada MFA, SSO, SCIM, etc. |
| Create ≠ access permanece (Membership Approved + Role) | Que Auth Freeze se reabra |
| `membership_id` es la identidad operacional preferida | Que RI-001 multi-membership se active ya |
| Soft-archive + `identity_events` son el patrón de evidencia | Que se borren datos de identidad |
| Capacidades nuevas se **añaden** sobre el pipeline | Que se inventen pipelines paralelos |

```text
Identity (auth.users)
    ↓
Profile (profiles)
    ↓
Membership (tenant_members · membership_id)
    ↓
Role (user_roles · RBAC)
    ↓
Workspace
```

**Forbidden without ADR + operational evidence:**

- ✗ Redesign Identity / Profile / Membership split  
- ✗ Create ≡ access shortcuts  
- ✗ Hard-delete de profiles / memberships / employee_profiles  
- ✗ Multi-membership / tenant switch / SSO / SCIM / impersonation “porque sí”  
- ✗ Sustituir `identity_events` por acoplamiento ad-hoc entre módulos  

**Allowed:**

- ✓ Bug / security fixes  
- ✓ Activación de providers Auth ya previstos (OAuth · Phone) bajo Identity Freeze  
- ✓ Nuevas capabilities / eventos Identity **compatibles** con el modelo  
- ✓ Extender `created_by_membership_id` a tablas operacionales  
- ✓ MFA / SSO / SCIM **solo** con ADR y evidencia operacional  

---

## Relación con Identity Freeze (Auth)

| Acta | Capa | Estado |
|------|------|--------|
| [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) | Auth / Session / Callback / OAuth gated | Frozen |
| **IDENTITY_FOUNDATION_LOCK_v1** | Modelo Identity · Membership · Provisioning · Audit | **LOCKED** |

Ambas actas son **complementarias**. Freeze = no tocar Auth. Lock = no rediseñar el modelo de identidad empresarial.

---

## Mapa de capas del proyecto (post-Lock)

```text
Foundation                 ✅  LOCKED
Identity Foundation        ✅  LOCKED  ← esta acta
Entry                      ✅  CERTIFIED
Journey                    ✅  COMPLETE
Flow                       ⏳  siguiente foco de certificación
Business Modules           🚧
Operational Core (Event Bus · Notifications · Jobs)  → tras Flow / evidencia
```

**No dedicar más ciclos a rediseñar Foundation ni Identity.**

---

## Orden estratégico siguiente (recomendado)

```text
✅ Foundation
↓
✅ Identity Foundation Lock
↓
✅ Entry
↓
✅ Journeys
↓
⏳ Flow                          ← siguiente cierre de certificación
↓
Operational Event Bus            ← extender patrón identity_events → business events
↓
Notification Center
↓
Background Jobs
↓
Production Readiness
```

Flow genera los handoffs/eventos que el Event Bus consumirá.  
No construir Event Bus / Notifications “por si acaso”: abrirlos con **necesidad operacional demostrada**.

---

## Criterio de reapertura

Solo se reabre el Lock si:

1. Existe **evidencia operacional** (FOPEBA / RI / incidente productivo) de que el modelo bloquea el negocio, **y**  
2. Se publica un ADR superseding (0018/0019), **y**  
3. Se actualiza esta acta con estado `SUPERSEDED` (no se reescribe el historial).

---

## Firma de cierre

| Campo | Valor |
|-------|-------|
| Decisión | Identity Foundation **LOCKED v1** |
| Fecha | 2026-07-29 |
| Evidencia PR | #90 (lifecycle) · #91 (hardening) |
| Siguiente foco | **Flow** (Bloque G) — no Identity |
