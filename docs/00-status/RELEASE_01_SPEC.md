# RELEASE-01 · Product SaaS · Specification

**Documento:** `RELEASE_01_SPEC.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **FROZEN** (Spec · #229) · DoR ✅ (#228) · Runner ✅ · Gate ✅ READY · P1 ✅ · 002 ▶ P2  
**Nivel:** Product Release Contract — certifica **YourMeal OS como SaaS** · **no** el framework  
**DoR:** [RELEASE_01_DOR](./RELEASE_01_DOR.md) ✅ en `main` (#228 · `c13f2b8`)  
**Strategy:** [RELEASE_01_STRATEGY](./RELEASE_01_STRATEGY.md)  
**Runner:** [RELEASE_01_RUNNER](../10-validation/release-01/RELEASE_01_RUNNER.md)  
**Gate:** [RELEASE_01_GATE](../10-validation/release-01/RELEASE_01_GATE.md)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Precondición:** tag `release-01-beta` → `facb917`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Contrato FROZEN. RELEASE-01 certifica el **producto**.  
> El pipeline Track B (Smoke…Rollback · Beta) se **reutiliza**; no se re-certifica.  
> EatClean es el **primer tenant**, no el producto entero.

---

## 1. Goal

> ¿Qué debe demostrar YourMeal OS para certificarse como plataforma SaaS operable?

RELEASE-01 certifica que el software puede operar como **SaaS de catering / meal prep**:  
identidad y tenant, núcleo de negocio, operaciones, administración y acceptance de producto.

No: *¿podemos certificar cómo liberar?* (eso es `release-01-beta`)  
No: *¿Smoke / Deploy / Rollback siguen PASS?* (ya lo certifican sus tags `-pass`)  
Sí: *¿YourMeal OS hace lo que un SaaS operable debe hacer?*

---

## 2. Scope

### Dentro (v1 · congelado)

| Incluye | Notas |
|---------|-------|
| Cadena canónica P1 → P2 → P3 → P4 → P5 | Foundation → Business → Ops → Admin → Acceptance |
| Tokens `RELEASE_01_P*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Una capacidad / entrega `RELEASE-01-001`…`005` | Tras Gate READY |
| Land Check desde `main` (Regla 9) | Solo `main` certifica |

### Cadena canónica

```text
P1  Platform Foundation
    Authentication · Tenant · RBAC · Profiles · Localization · Settings
  ↓
P2  Core Business Modules
    Dish Library · Ingredients · Recipes · Customers · Orders
  ↓
P3  Operations
    Production · Production Calendar · Routes · Deliveries · Inventory
  ↓
P4  Administration
    Billing · Reports · Notifications · Audit · Configuration
  ↓
P5  Product Acceptance
    Checklist · cross-module · navegación · consistencia SaaS · readiness
  ↓
RELEASE-01 PASS
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Re-certificar Smoke · Cross-flow · E2E · Deploy · Rollback · Beta | Framework ya cerrado |
| FLOW-05 por inercia | Solo si es criterio de un bloque P1–P5 |
| Capacitor · App Store · Play Store · producción real | Fases posteriores |
| CI/CD adicional · secretos en actas | Fuera de contrato Spec |
| Semver `v*` · marketing readiness | Fuera de RELEASE-01 |

---

## 3. Canonical transitions (P1–P5)

### P1 · Platform Foundation

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La plataforma admite identidad, aislamiento de tenant y configuración base? |
| **Incluye** | Authentication · Tenant · RBAC · Profiles · Localization · Settings |
| **No incluye** | Módulos de negocio · operaciones · billing |
| **Evidencia** | `RELEASE_01_P1_STARTED` · `RELEASE_01_P1_COMPLETED` |
| **PASS** | Foundation consumible por P2 |
| **Entrega** | RELEASE-01-001 |

### P2 · Core Business Modules

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El núcleo funcional del SaaS es operable (aún sin operaciones)? |
| **Incluye** | Dish Library · Ingredients · Recipes · Customers · Orders |
| **No incluye** | Production · Routes · Deliveries · Inventory |
| **Evidencia** | `RELEASE_01_P2_STARTED` · `RELEASE_01_P2_COMPLETED` |
| **PASS** | Core business consumible por P3 |
| **Entrega** | RELEASE-01-002 |

### P3 · Operations

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La operación diaria sostiene el producto? |
| **Incluye** | Production · Production Calendar · Routes · Deliveries · Inventory |
| **No incluye** | Billing · Reports · Notifications (P4) |
| **Evidencia** | `RELEASE_01_P3_STARTED` · `RELEASE_01_P3_COMPLETED` |
| **PASS** | Operations consumible por P4 |
| **Entrega** | RELEASE-01-003 |

### P4 · Administration

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Administración, cobro y gobernanza bastan para operar el SaaS? |
| **Incluye** | Billing · Reports · Notifications · Audit · Configuration |
| **No incluye** | Acceptance de producto (P5) · stores · producción masiva |
| **Evidencia** | `RELEASE_01_P4_STARTED` · `RELEASE_01_P4_COMPLETED` |
| **PASS** | Administration consumible por P5 |
| **Entrega** | RELEASE-01-004 |

### P5 · Product Acceptance

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El producto como conjunto está listo para RELEASE-01 PASS? |
| **Incluye** | Acceptance checklist · cross-module · navegación · consistencia SaaS · readiness |
| **No incluye** | Re-ejecutar Smoke / Cross-flow / E2E / Deploy / Rollback |
| **Evidencia** | `RELEASE_01_P5_STARTED` · `RELEASE_01_P5_COMPLETED` |
| **PASS** | RELEASE-01 FULL PASS · listo para tag de producto (fuera de este Spec freeze) |
| **Entrega** | RELEASE-01-005 |

### Orden (inmutable)

```text
P1 → P2 → P3 → P4 → P5
```

Prohibido saltar, reordenar o completar Pₙ₊₁ sin Pₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_01_P1_STARTED
RELEASE_01_P1_COMPLETED
RELEASE_01_P2_STARTED
RELEASE_01_P2_COMPLETED
RELEASE_01_P3_STARTED
RELEASE_01_P3_COMPLETED
RELEASE_01_P4_STARTED
RELEASE_01_P4_COMPLETED
RELEASE_01_P5_STARTED
RELEASE_01_P5_COMPLETED
```

Reglas: once-only · orden estricto · `duplicates=[]` · `missing=[]` · `out_of_order=[]` para FULL PASS.

---

## 5. Canonical PASS contract

**FULL PASS** solo si:

```text
P1 → P2 → P3 → P4 → P5
certified_through=P5
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

**Runner-only (baseline Gate):**

```text
BLOCKED at RELEASE_01_P1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 2
```

---

## 6. Progressive delivery

| Entrega | Through | Esperado |
|---------|---------|----------|
| Runner only | — | BLOCKED at P1 · exit 2 |
| RELEASE-01-001 | P1 | PASS through P1 · BLOCKED at P2 |
| RELEASE-01-002 | P2 | PASS through P2 · BLOCKED at P3 |
| RELEASE-01-003 | P3 | PASS through P3 · BLOCKED at P4 |
| RELEASE-01-004 | P4 | PASS through P4 · BLOCKED at P5 |
| RELEASE-01-005 | P5 | FULL PASS · blocked_at=— |

---

## 7. Invariants

- Producto ≠ framework  
- EatClean = primer tenant · no el producto  
- Pipeline Track B no se reabre  
- Una transición / PR de capacidad  
- Land Check desde `main` (Regla 9)  
- Evidence before Implementation  

---

## 8. Evidence policy

Actas bajo `docs/10-validation/release-01/`.  
Evidencia JSON generada por el runner (no secretos).  
Gate nunca se cierra solo porque un PR pase.

---

## 9. Ready / Freeze status

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena P1–P5 | ✅ |
| Tokens · Transitions · Evidence | ✅ |
| PASS · BLOCKED · Invariants | ✅ |
| Spec FROZEN | ✅ este PR |
| Runner live through P1 | ✅ #229…001 |
| Gate READY | ✅ #229 |
| RELEASE-01-001 | ✅ CERTIFIED #230 (P1) |
| RELEASE-01-002 | ✅ CERTIFIED #231 (P2) |
| RELEASE-01-003 | ✅ CERTIFIED #232 (P3) |
| RELEASE-01-004 | ✅ CERTIFIED #233 (P4) |
| RELEASE-01-005 | ▶ este PR (P5 only) |

**Estado del documento:** ✅ **FROZEN**

---

## 10. Next

```text
RELEASE-01-005 · P5 OPEN
    ↓
Land Check from main
    ↓
READY TO OPEN
tag release-01-pass · PASS acta · Gate CLOSED
```

---

## End of RELEASE-01 Spec
