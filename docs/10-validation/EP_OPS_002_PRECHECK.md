# EP-OPS-002 · PRE-CHECK

**Fecha:** 2026-07-28  
**Rama tip auditada:** `main` @ post-#87 → implementación en `cursor/ep-ops-002-surface-cert-f54a`  
**Epic:** Surface & Workspace Certification  
**Restricciones:** no Auth · no RBAC redesign · no Identity · no RLS · no Bootstrap  

---

## Hallazgos previos (reproducibilidad)

| ID | Descripción | Reproducible | Clasificación |
|----|-------------|:------------:|---------------|
| **RBAC-001 / FCR-001** | Tenant `/admin/settings` hub idéntico para Company Admin y perfil híbrido Platform+Tenant; Platform Surface es `/saas` (guard `saas.manage`) | Sí | **VALID** → cerrado como diseño Tenant (ver cert) |
| **WEP-001 / FCR-004** | Kitchen landing: WEP pedía `kitchen-execution`; código + `OPERATIONS_WORKSPACES` → `/admin/kitchen` | Sí | **PARTIAL** → **CERTIFIED** canónico `/admin/kitchen` |
| **WEP-001 / FCR-005** | Support → `/admin` (genérico); Accounting → `/admin` (genérico) | Sí | **VALID** → **FIXED** → `/admin/support` · `/admin/accounting` |
| **WEP-001 / FCR-006** | Híbrido `company_admin`+`saas_admin` → `/admin` (no `/saas`) | Sí | **PARTIAL** → **CERTIFIED** tenant-first |
| **LP-001** | `homePathForRoles` determinista (tests) pero no alineado WEP Support/Accounting | Sí | **VALID** → **FIXED** + documentado |

Ningún hallazgo **STALE** por PRs posteriores en tip auditado.

---

## Auditoría de código (pre → post)

| Función / ruta | Pre | Post EP-OPS-002 |
|----------------|-----|-----------------|
| `homePathForRoles()` | Support/Accounting → `/admin` | Support → `/admin/support` · Accounting → `/admin/accounting` · inventory/purchasing → `/admin/inventory` |
| `resolveHomePath()` | roles + LP | Sin cambio de contrato |
| `decideOperationsCenterEntry()` | sole workspace / admin / saas | Alineado (support/accounting direct) |
| `assertSaasRoute` | deny → `/app` | deny staff → **`/admin`** · else `/app` |
| Workspace id support | `customers` | **`support`** → `/admin/support` |

---

## Decisión PRE-CHECK → ejecución

| Acción | Estado |
|--------|--------|
| Documentar LP / WEP / Matrix / Surface cert | **DONE** |
| Alinear landings Support · Accounting · kitchen canónico | **DONE** |
| Negativo: Company Admin → `/saas` → Tenant home | **DONE** |
| Cambiar capabilities / roles / Auth | **No** |
| Evidence Gate | **PASS** — ver docs Bloque G |

---

## Certificación

| ID | Status |
|----|--------|
| RBAC-001 | **CERTIFIED** |
| WEP-001 | **CERTIFIED** |
| LP-001 | **CERTIFIED** |

**Pregunta maestra:** ¿Cuando cualquier usuario inicia sesión, entra automáticamente en la superficie correcta, el workspace correcto y el contexto operacional correcto?

**Respuesta: SÍ.**
