# Ops Center · Dual Surface (EatClean vs YourMeal OS)

**Estado:** Entry Point **implementado en `main`** · evidencia de certificación pendiente (EP-OPS-001 / CHECK-IT 05)  
**Tipo:** Correction / Certification — alineado OCM-001  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) · Spec: [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · Hardening: [RBAC_HARDENING_RI-001](./RBAC_HARDENING_RI-001.md)

---

## Principio

```text
EatClean              →  Opera el negocio (tenant)     /admin
YourMeal OS           →  Gobierna la plataforma (SaaS) /saas
```

Dos niveles. Un solo producto; un Centro de Operaciones por tenant + Centro de Gobierno de plataforma.

---

## Modelo de acceso (definitivo · 2026-07-24)

| Actor | Home | Notas |
|-------|------|-------|
| Cliente | `/app` | Customer App |
| Staff tenant | `/admin` | Company Ops Center |
| `saas_admin` puro | `/saas` | Platform console |
| Híbrido staff + saas | `/admin` | + `SaasOpsEntry` → `/saas` |
| Driver | `/driver` | Workspace propio |

**No** enviar `saas_admin` a `/app`.

---

## Dual Operations Entry Point (WP-3) · estado código

| Aspecto | Estado |
|---------|:------:|
| `home-path.ts` (saas puro → `/saas`; híbrido → `/admin`) | ✅ |
| `SaasOpsEntry` en `/admin` (bajo Centro de Operaciones) | ✅ |
| Ausente en `/app` y `/auth` | ✅ |
| RBAC vía `isSaasAdmin` (sin duplicar lógica) | ✅ |
| Alineado OCM-001 | ✅ |

Componente: `src/components/tenant/saas-ops-entry.tsx`.

---

## Objetivo UX

### 1. Centro de Operaciones EatClean (`/admin`)

Uso diario. Solo módulos del tenant:

```text
Dashboard · Cocina · Producción · Reparto
Atención al Cliente · Clientes · Empresas
Administración · Finanzas · Configuración
(+ SaasOpsEntry si saas_admin)
```

### 2. Centro de Operaciones YourMeal OS (`/saas`)

```text
Powered by YourMeal OS
Centro de Operaciones YourMeal OS
```

Solo `saas_admin`. Tenant Provisioning (DICT-073) · Roles · Branding · Auditoría · Flags.

---

## Criterio de aceptación restante (certificación)

Implementación del entry: ✅.  
Pendiente Certification Sprint: evidencia de que Company Admin **nunca** ve `/saas` y que saas híbrido opera desde `/admin` con entry discreta (actas / CHECK-IT 05).
