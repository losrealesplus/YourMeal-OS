# FLOW-02 · Delivery Incidents · Specification

**Documento:** `FLOW_02_DELIVERY_INCIDENTS_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **SPEC FROZEN** (PR #148) · runner canónico ▶ · sin dominio hasta FLOW02-001  
**Precondición:** FLOW-01 ✅ CERTIFIED · tag `flow01-pass` · [FLOW01_PASS_ACTA](../10-validation/flow-01/FLOW01_PASS_ACTA.md)  
**DoR:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · checklist parcial abajo  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7–8 · [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Catálogo:** [FLOW_CATALOG](./FLOW_CATALOG.md)

> Continúa el happy path de FLOW-01 modelando la **excepción real** de reparto,  
> sin mezclar facturación (FLOW-03) ni Support tickets.

---

## Pregunta de Flow

> ¿Un intento de entrega fallido queda operable (registrado, visible, reintentable)  
> sin fingir `delivered` y sin tocar facturación?

No: *¿funciona la pantalla de incidencias?*  
Sí: *¿el Outcome de un fallo de Delivery es consumible y trazable?*

---

## Relación con FLOW-01

```text
FLOW-01 happy path
ready_for_delivery → out_for_delivery → delivered

FLOW-02 excepción
out_for_delivery → delivery_issue → (retry) out_for_delivery → delivered
                 └─ evidencia de incidencia ─┘
```

FLOW-01 **nombra** `delivery_issue` como desviación (no happy path).  
FLOW-02 **certifica** ese camino como Flow propio.

---

## Alcance

**Dentro:**

| Incluye | Notas |
|---------|--------|
| Registrar intento fallido | `delivery_issue` + nota / attempt audit |
| Visibilidad operativa | Cola / lista de incidencias |
| Reintento | `delivery_issue` → `out_for_delivery` |
| Cierre operativo | Reintento exitoso → `delivered` |

**Fuera (explícito):**

| Excluye | Motivo |
|---------|--------|
| Facturación / cobros | FLOW-03 Billing |
| Support tickets / `support_notes` | Flow Support aparte |
| Cancel / reempaquetar Kitchen | Otro Flow o incidencia Kitchen |
| Nueva entidad Incident 1ª clase | v1 = status + attempt (as-built) |
| Optimización de rutas | Fuera de certificación |

---

## Estados (pedido · spine Delivery)

| Estado | Rol en FLOW-02 |
|--------|----------------|
| `out_for_delivery` | Entrada típica (intento en curso) |
| `delivery_issue` | Incidencia abierta |
| `out_for_delivery` | Retry tras incidencia |
| `delivered` | Resolución operativa exitosa |

As-built: `DeliveryService.recordAttempt` · `OperationsService.transitionDelivery` · UI `admin.routes.incidents`.

---

## Plantilla canónica por transición

Misma estructura que FLOW-01:

| Elemento | Descripción |
|----------|-------------|
| Estado inicial | … |
| Evento | … |
| Precondiciones | … |
| Acción | … |
| Estado final | … |
| Evidencia | token `FLOW02_*` |
| Criterio PASS | once-only + orden + invariantes |

### T1 · Registrar incidencia

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | `out_for_delivery` (intento en curso) |
| **Evento** | Conductor / ops marca intento fallido |
| **Precondiciones** | Tenant activo · rol logistics/delivery · pedido en ruta · nota/motivo |
| **Acción** | `recordAttempt(issue)` / transición → `delivery_issue` |
| **Estado final** | `delivery_issue` · attempt auditado |
| **Evidencia** | `FLOW02_T1_STARTED` → `FLOW02_T1_COMPLETED` |
| **Criterio PASS** | Tokens once-only; **no** emite `delivered` |

### T2 · Reintento

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | `delivery_issue` |
| **Evento** | Ops reabre entrega |
| **Precondiciones** | T1 COMPLETED · incidencia visible |
| **Acción** | Transición → `out_for_delivery` |
| **Estado final** | De nuevo en ruta |
| **Evidencia** | `FLOW02_T2_STARTED` → `FLOW02_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only; trazabilidad order_id |

### T3 · Resolución entregada

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | `out_for_delivery` (post-retry) |
| **Evento** | Entrega confirmada al cliente |
| **Precondiciones** | T2 COMPLETED |
| **Acción** | `recordAttempt(delivered)` / `completeDelivery` |
| **Estado final** | `delivered` |
| **Evidencia** | `FLOW02_T3_STARTED` → `FLOW02_T3_COMPLETED` |
| **Criterio PASS** | Terminal `delivered` · sin facturar |

---

## Invariantes

1. Un pedido en `delivery_issue` **no** cuenta como `delivered`.  
2. Cada token `FLOW02_T*` se emite **exactamente una vez** por ejecución certificada.  
3. No hay facturación ni side-effects de Billing en este Flow.  
4. Retry no borra el historial de attempts / audit.  
5. Determinismo: mismo input → misma secuencia de evidencias.  
6. Sin bridge manual (Excel/chat) para cerrar la incidencia en el happy path de excepción.

---

## Evidencia requerida por transición

| Transición | Tokens obligatorios | Assertions mínimas |
|------------|---------------------|--------------------|
| **T1** | `FLOW02_T1_STARTED` → `FLOW02_T1_COMPLETED` | status=`delivery_issue` · attempt auditado · **no** `delivered` |
| **T2** | `FLOW02_T2_STARTED` → `FLOW02_T2_COMPLETED` | status=`out_for_delivery` · historial de attempts intacto |
| **T3** | `FLOW02_T3_STARTED` → `FLOW02_T3_COMPLETED` | status=`delivered` · sin side-effects de Billing |

Cada token: **exactamente una vez**, en orden global T1→T2→T3.

---

## Contrato de evidencias (listo para Freeze)

```text
FLOW02_T1_STARTED
FLOW02_T1_COMPLETED

FLOW02_T2_STARTED
FLOW02_T2_COMPLETED

FLOW02_T3_STARTED
FLOW02_T3_COMPLETED
```

Reglas (igual que FCR-008 / FLOW-01):

- Cada paso **exactamente una vez**, en ese orden  
- `STOP` + `reason` si falla precondición/invariante  
- Evidencia JSON comparable en `docs/10-validation/flow-02/evidence/`  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`  
- Los nombres **no** cambian por refactors de UI/función  

Opcional envoltura: `FLOW02_START` / `FLOW02_END` en el runner.

---

## Semántica PASS / FAIL / BLOCKED

| Resultado | Significa |
|-----------|-----------|
| **PASS** | Contrato cumplido hasta el `--through` pedido (o FLOW-02 completo en T3) |
| **FAIL** | Brecha de contrato / invariante / evidencia (defecto) |
| **BLOCKED** | Siguiente transición **aún no implementada** — no es defecto |

### PASS / BLOCKED esperados por fase

| Fase | Runner (sin dominio / parcial / completo) |
|------|-------------------------------------------|
| Runner recién creado · **0 dominio** | `flow_status=BLOCKED` · `blocked_at=FLOW02_T1_STARTED` |
| FLOW02-001 (T1) | PASS through T1 · BLOCKED at `FLOW02_T2_STARTED` |
| FLOW02-002 (T2) | PASS through T2 · BLOCKED at `FLOW02_T3_STARTED` |
| FLOW02-003 (T3) | **FLOW-02 PASS** completo · status=`delivered` |

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| `FLOW02_T1_COMPLETED` con status ≠ `delivery_issue` | Violación T1 |
| `delivery_issue` contado como `delivered` | Violación invariante 1 |
| Token `FLOW02_*` duplicado o fuera de orden | Violación evidencia |
| T3 COMPLETED con side-effect de Billing | Fuera de alcance / invariante 3 |
| Retry borra attempts previos | Violación invariante 4 |
| Solo UI “parece bien” sin tokens | No Done de Flow |

---

## Runner canónico (objetivo post-Freeze · no en este PR)

Equivalente a `test:flow01-canonical` / FCR-008:

```text
FLOW02
FLOW02_T1_STARTED
    ↓
FLOW02_T1_COMPLETED
    ↓
FLOW02_T2_STARTED
    ↓
FLOW02_T2_COMPLETED
    ↓
FLOW02_T3_STARTED
    ↓
FLOW02_T3_COMPLETED
    ↓
PASS
```

Comando: `npm run test:flow02-canonical`  
Doc: [FLOW02_CANONICAL_RUNNER](../10-validation/flow-02/FLOW02_CANONICAL_RUNNER.md)  
Comportamiento inicial (contrato ejecutable · **sin** dominio):

```text
FLOW-02
BLOCKED
blocked_at=FLOW02_T1_STARTED
```

Los **invariantes** de este documento deben ser assertions del runner (no solo prosa).

---

## Checklist pre-Freeze

| Elemento | Estado |
|----------|--------|
| Estados del flujo | ✅ `out_for_delivery` · `delivery_issue` · `delivered` |
| Transiciones T1–T3 | ✅ plantilla canónica |
| Invariantes | ✅ § Invariantes (1–6) |
| Eventos / tokens `FLOW02_*` | ✅ contrato T1–T3 STARTED/COMPLETED |
| PASS esperado | ✅ por fase + FULL en T3 |
| BLOCKED esperado | ✅ runner vacío en T1 · parcial en T2/T3 |
| Evidencia requerida por transición | ✅ tabla dedicada |

Si algún ítem quedara abierto → **no Freeze** · no runner.

---

## Definition of Ready (estado)

| Artefacto | Estado |
|-----------|--------|
| SPEC | ✅ **FROZEN** (#148) |
| Contrato `FLOW02_*` | ✅ congelado |
| Runner `test:flow02-canonical` | ▶ activo (BLOCKED at T1 · sin dominio) |
| Estados permitidos | ✅ |
| Invariantes | ✅ |
| PASS / BLOCKED esperados | ✅ |
| Acta (path) | ⏳ tras FLOW02-001…003 |

**Implementation de dominio:** ❌ prohibida hasta DoR completo · siguiente = FLOW02-001 (Regla 8).

---

## Plan de trabajo

| Fase | Trabajo | Estado |
|------|---------|--------|
| 1 | Spec (#148) | ✅ **FROZEN** |
| 2 | Runner canónico (`test:flow02-canonical` · BLOCKED at T1) | ✅ (#150) |
| 3 | FLOW02-001 T1 | ✅ (#151) |
| 4 | FLOW02-002 T2 | ▶ |
| 5 | FLOW02-003 T3 | ⏳ |

---

## Fuera de Spec

- Reabrir FLOW-01 / FCR-008 salvo regresión  
- Billing · Support · Inventory  
- Runner código · implementación de producto en este PR  
