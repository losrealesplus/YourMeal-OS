# EP-OPS-003 · Workspace Operational Journey Certification

**Estado ejecución:** IN PROGRESS · Kitchen CERTIFIED · Delivery NEXT  
**Metodología:** ✅ **FROZEN** — [acta](./EP_OPS_003_METHODOLOGY_FROZEN.md) · 2026-07-28  
**Fecha apertura:** 2026-07-28  
**Programa:** RI-001 · Bloque C (jornadas)  
**Prerrequisito:** EP-OPS-002 · Entry architecture **CERTIFIED**  
`(RBAC-001 · WEP-001 · LP-001)` — PR #88 · [WORKSPACE_ENTRY_POLICY](../10-validation/WORKSPACE_ENTRY_POLICY.md)  

> **Methodology Frozen:** no nuevos conceptos. Solo ejecutar pasadas · evidencia · Gates (P11–P13).  
> Reabrir metodología solo con aprobación explícita + evidencia que lo justifique.  

```text
Identity
    ↓
Surface
    ↓
Workspace                    ← Entry CERTIFIED (EP-OPS-002)
    ↓
Operational Journey          ← ESTE EPIC (EP-OPS-003)
    ↓
Operational Outcome
    ↓
Cross-Department Flow        ← Bloque G (después)
    ↓
Operational Readiness
```

---

## CERTIFIED vs Gate (FOPEBA)

Una certificación **no** exige ausencia total de observaciones.

| Señal | Significado |
|-------|-------------|
| **CERTIFIED** | El Journey cumple su **objetivo operacional** (Outcome alcanzado) |
| **Gate PASS** | Cumple sin observaciones materiales |
| **Gate OBSERVATIONS** | Cumple el Outcome; aspectos documentados a seguir — **no bloquean** la operación |
| **Gate FAIL** | No se alcanza el Outcome · bloqueo P0/P1 · o evidencia insuficiente (P13) |

```text
CERTIFIED  ≠  “perfecto”
CERTIFIED  =  Outcome operacional demostrado + evidencia reproducible
OBSERVATIONS = deuda/seguimiento explícito, no denegación del Journey
```

Ejemplo Kitchen:

| Workspace | Estado | Gate | Outcome |
|-----------|--------|------|---------|
| Kitchen | ✅ CERTIFIED | OBSERVATIONS | Production Ready |

---

## Regla de continuidad entre Journeys

**Cada Journey comienza exactamente donde termina el anterior.**

```text
Workspace N
  Outcome: X
        ↓
Workspace N+1
  Input:   X
```

Cadena EP-OPS-003:

```text
Kitchen
  Outcome: Production Ready
        ↓
Delivery
  Input:   Production Ready
  Outcome: Orders Delivered
        ↓
Support
  Input:   Orders Delivered
  Outcome: Issues Resolved
        ↓
Accounting
  Input:   Completed Orders · Resolved Incidents · Billing Events
  Outcome: Financial Records Complete
```

Efectos:

- Evita duplicar certificación del eslabón anterior.
- El Outcome del upstream es el contrato de Input del downstream.
- Prepara **Bloque G (Flow)**: trazabilidad Outcome→Input entre departamentos.

**No abrir** el Journey N+1 si el Outcome de N no está CERTIFIED (Gate PASS u OBSERVATIONS).

---

## Cadena metodológica

| Nivel | Epic / bloque | Qué certifica |
|-------|---------------|---------------|
| **Entry** | EP-OPS-002 | El usuario entra donde corresponde |
| **Journey** | **EP-OPS-003** | El usuario completa su trabajo **dentro** del Workspace → **Outcome** |
| **Flow** | RI-001 Bloque G | Continuidad Outcome→Input entre departamentos |
| **Readiness** | ORR / CG-RI-001 | La empresa opera como sistema |

Entry ≠ Journey ≠ Flow. No mezclar gaps de navegación con gaps operacionales ni con handoffs.

---

## Contexto

La arquitectura de entrada está certificada.

**Este epic no certifica el acceso.**  
**Certifica la operación interna de cada Workspace → Outcome operacional.**

Pregunta maestra por workspace:

> ¿Puede este departamento completar de principio a fin sus tareas críticas sin abandonar su Workspace y sin depender de funcionalidades de otras superficies?

---

## Objetivo

Validar que cada Workspace soporta el trabajo operativo para el que fue diseñado — cadena de valor meal prep + **regla de continuidad**.

---

## Orden de certificación (cadena de valor)

```text
Kitchen → Delivery → Support → Accounting
```

| # | Workspace | Input (continuidad) | Outcome |
|---|-----------|---------------------|---------|
| 1 | **Kitchen** | Demanda / pedidos confirmados | **Production Ready** |
| 2 | **Delivery** | **Production Ready** (Kitchen) | **Orders Delivered** |
| 3 | **Support** | **Orders Delivered** (Delivery) | **Issues Resolved** |
| 4 | **Accounting** | Pedidos completados · incidencias · eventos de cobro | **Financial Records Complete** |

---

## Workspaces en alcance

| Workspace | Landing | Outcome | Gate | Estado |
|-----------|---------|---------|:----:|--------|
| Kitchen | `/admin/kitchen` | Production Ready | **OBSERVATIONS** | ✅ **CERTIFIED** |
| Delivery | `/admin/delivery` | Orders Delivered | — | NOT STARTED · **NEXT** |
| Support | `/admin/support` | Issues Resolved | — | NOT STARTED |
| Accounting | `/admin/accounting` | Financial Records Complete | — | NOT STARTED |

### Progress global

```text
EP-OPS-002          Entry CERTIFIED
        ↓
Kitchen             CERTIFIED · OBSERVATIONS · Production Ready
        ↓
Delivery            Pendiente · Orders Delivered
        ↓
Support             Pendiente · Issues Resolved
        ↓
Accounting          Pendiente · Financial Records Complete
        ↓
Bloque G            Flow Certification
```

Evidencia Kitchen: [ep-ops-003/kitchen/](../10-validation/ep-ops-003/kitchen/)  
Prep Delivery: [ep-ops-003/delivery/](../10-validation/ep-ops-003/delivery/)

---

## Jornadas objetivo

### Kitchen → Production Ready ✅

```text
KJ-01 → KJ-04  ·  Outcome: Production Ready
```

### Delivery → Orders Delivered (NEXT)

```text
Input: Production Ready
DJ-01…DJ-06  ·  Outcome: Orders Delivered
```

### Support → Issues Resolved

```text
Input: Orders Delivered
  ·  Outcome: Issues Resolved
```

### Accounting → Financial Records Complete

```text
Input: Completed Orders · Resolved Incidents · Billing Events
  ·  Outcome: Financial Records Complete
```

---

## Evidence Gate (por Workspace)

```text
PASS            → Outcome alcanzado · sin observaciones materiales
OBSERVATIONS    → Outcome alcanzado · hallazgos no bloqueantes → CERTIFIED permitido
FAIL            → Outcome no alcanzado · bloqueo P0/P1 · evidencia insuficiente (P13)
```

**CERTIFIED** = Outcome demostrado (PASS u OBSERVATIONS). No requiere “cero observaciones”.

---

## Tras los cuatro packs

```text
Journeys CERTIFIED (continuidad Outcome→Input)
        ↓
Bloque G · Flow Certification
```

---

## Restricciones del epic

| Permitido | Prohibido |
|-----------|-----------|
| Certificar jornadas existentes | Features solo “para pasar el gate” |
| CERTIFIED con OBSERVATIONS | Fingir PASS limpio ocultando hallazgos |
| Anotar Flow Gaps → Bloque G | Ejecutar Flow aquí |
| Actualizar Progress por gate | Bloque C PASS sin las 4 jornadas |
| Corregir bloqueos de cert | Reabrir Auth / Identity / RBAC |

---

## Resultado al cerrar el epic

```text
EP-OPS-002 → Entry
EP-OPS-003 → Journey (+ Outcomes + continuidad)
Bloque G   → Flow
ORR        → Operational Readiness
```
