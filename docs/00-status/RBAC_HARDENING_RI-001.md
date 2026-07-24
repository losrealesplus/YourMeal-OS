# RBAC Hardening · RI-001

**Estado:** Implementación ✅ PASS ([CHECK-IT 04](./CHECK_IT_04_RBAC_HARDENING.md))  
**Evidencia de campo (revocación):** 🟡 pendiente Certification Sprint  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [CAPABILITY_MATRIX](../09-security/CAPABILITY_MATRIX.md)

---

## Principio

> Ocultar el menú **no** es seguridad. Toda ruta protegida debe fallar en `beforeLoad` si falta la capability.

---

## Mecanismo

| Capa | Mecanismo |
|------|-----------|
| Parent `/admin` | `assertStaffRoute` → roles en context |
| Child `/admin/*` | `assertCapabilityFromContext(context, capability)` |
| SaaS `/saas` | `assertSaasRoute` / `saas.manage` |
| Driver | `assertDriverRoute` · home `/driver` |
| Refresh | `postgres_changes` en `user_roles` → `useAuth` |

API: `src/permissions/route-guards.ts`.

---

## Home paths (OCM-001)

| Roles | Path |
|-------|------|
| Cliente | `/app` |
| Staff tenant | `/admin` (o deep-link cocina/reparto) |
| `saas_admin` puro | `/saas` |
| Híbrido staff + saas | `/admin` + `SaasOpsEntry` → `/saas` |
| Driver | `/driver` |

---

## Dual Ops Entry

`SaasOpsEntry` solo en `/admin` (Centro de Operaciones).  
No en `/app` ni `/auth`. Reutiliza `isSaasAdmin` — sin RBAC duplicado.

---

## Certification note

CHECK-IT 04 PASS = hardening de código.  
Para CG-RI-001 hace falta además evidencia documentada de acceso negativo y revocación (Certification Sprint).
