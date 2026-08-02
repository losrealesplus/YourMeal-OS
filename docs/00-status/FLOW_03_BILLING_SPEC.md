# FLOW-03 · Billing · Specification

**Documento:** `FLOW_03_BILLING_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **SPEC READY FOR FREEZE** — checklist pre-Freeze · sin runner ni dominio en este PR  
**Precondición:** FLOW-02 ✅ CERTIFIED · tag `flow02-pass` · [FLOW02_PASS_ACTA](../10-validation/flow-02/FLOW02_PASS_ACTA.md)  
**DoR:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7–9 · [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Catálogo:** [FLOW_CATALOG](./FLOW_CATALOG.md)

> Facturación **desacoplada** del happy path Kitchen→Delivery y de las incidencias.  
> Certifica que un pedido `delivered` queda facturable, revisable y cobrado  
> sin reabrir Kitchen/Delivery ni mezclar Support / Inventory.

---

## Pregunta de Flow

> ¿Un pedido `delivered` queda operable en Accounting  
> (factura creada → revisada → cobrada) sin side-effects en Kitchen/Delivery  
> y sin fingir cobro antes de evidencia?

No: *¿funciona la pantalla de facturas?*  
Sí: *¿el Outcome financiero es consumible y trazable hasta `paid`?*

---

## Relación con FLOW-01 / FLOW-02

```text
FLOW-01 / FLOW-02
        │
        ▼
   order.status = delivered
        │
        ▼
FLOW-03 Billing
delivered (billable)
        │  T1
        ▼
invoice pending
        │  T2
        ▼
invoice reviewed
        │  T3
        ▼
invoice paid
```

FLOW-01/02 **producen** el input (`delivered`).  
FLOW-03 **certifica** el handoff financiero.

---

## Alcance

**Dentro (v1):**

| Incluye | Notas / as-built |
|---------|------------------|
| Selección de pedidos facturables | Solo `orders.status = delivered` |
| Crear factura | `AccountingService.createInvoiceFromOrders` → invoice `pending` |
| Revisar factura | `reviewInvoice` → lifecycle `review` / `reviewed_at` |
| Registrar cobro | `recordPayment` → invoice `paid` |
| Evidencia `FLOW03_T*` | Once-only · orden T1→T3 |

**Fuera (explícito):**

| Excluye | Motivo |
|---------|--------|
| Kitchen / Packaging / Delivery transitions | FLOW-01 / FLOW-02 |
| Delivery incidents / retry | FLOW-02 |
| Support tickets | Flow Support aparte |
| Inventory / stock | FLOW-04 |
| Void / overdue como happy path | Desviaciones nombradas · no certificación v1 |
| Reembolsos · notas de crédito · pagos parciales | Fuera de FLOW-03 v1 (ver Freeze Q&A) |
| Reversión `review` → `pending` | Prohibida en el happy path certificado |
| Cierre de periodo financiero (`closeFinancialPeriod`) | Follow-up / T4 opcional post-PASS |
| Cobro en app del cliente / pasarela externa | Fuera de certificación operativa EatClean v1 |
| Nueva entidad Billing aparte de `invoices`/`payments` | Usar as-built Accounting |

---

## Decisiones congeladas (Freeze Q&A)

Estas respuestas **no** se reinterpretan en el runner ni en la implementación.

### ¿Qué evento crea la factura?

| Campo | Valor congelado |
|-------|-----------------|
| Evento | Ops Accounting selecciona ≥1 pedido `delivered` y ejecuta **crear factura** |
| Acción canónica | `AccountingService.createInvoiceFromOrders({ orderIds })` |
| Efecto | Nace `Invoice` con `status=pending` · `reviewed_at=null` · `orderIds` trazables |
| No es creación | Auto-factura al marcar `delivered` · UI “parece creada” sin persistencia |

### ¿Un pedido puede tener varias facturas? (**Opción A — congelada**)

| Campo | Valor congelado |
|-------|-----------------|
| Regla | **1 pedido `delivered` → como máximo 1 factura activa** |
| Factura activa | Cualquier invoice vinculada vía `invoice_orders` con `status ≠ void` |
| Segunda llamada a `createInvoiceFromOrders` con el mismo `orderId` | **FAIL de dominio** (`INVALID_STATE` / ya facturado) — **no** crea duplicado · **no** es idempotent return |
| Billable set | `listBillableOrders` excluye pedidos ya vinculados a factura activa |
| Void + refacturar | ❌ fuera de FLOW-03 v1 (void no es happy path) |

Justificación: alineado con evidencia once-only y relación determinista pedido→factura en el contrato certificado.

### ¿Quién puede poner una factura en review?

| Campo | Valor congelado |
|-------|-----------------|
| Actor | Usuario con capability **`accounting.operate`** (roles Accounting / company_admin según RBAC) |
| Acción canónica | `AccountingService.reviewInvoice(invoiceId)` |
| Efecto | Setea `reviewed_at` (ISO) · lifecycle stage `review` · **`status` permanece `pending`** |
| Qué significa “review” | Ops confirma importes/líneas/periodo; **no** es cobro ni cambio a `paid` |

### ¿Puede volver de review a pending?

| Campo | Valor congelado |
|-------|-----------------|
| En FLOW-03 v1 | **No** — no hay transición certificada `reviewed` → “sin review” |
| Runner | Cualquier borrado de `reviewed_at` o retroceso = **FAIL** (si se observa en el pipeline) |
| Producto futuro | Requeriría nueva Spec / Flow; no se abre en este contrato |

### ¿`paid` es terminal dentro de FLOW-03?

| Campo | Valor congelado |
|-------|-----------------|
| Sí | `status=paid` es **terminal** del happy path FLOW-03 v1 |
| Tras `paid` | No hay más tokens `FLOW03_*` · no PASS adicional |
| As-built | `canTransitionInvoice("paid", *)` = vacío |

### ¿Reembolsos, anulaciones, notas de crédito, pagos parciales?

| Concepto | En FLOW-03 v1 |
|----------|---------------|
| Reembolso | ❌ fuera |
| Anulación / `void` | ❌ fuera del happy path (desviación nombrada) |
| Nota de crédito | ❌ fuera |
| Pago parcial | ❌ fuera — T3 registra cobro que deja la factura en **`paid` completo** |
| `overdue` | ❌ fuera del happy path |

Si el producto necesita esos caminos → Flow/Spec aparte; **no** diluyen este contrato.

---

## Estados permitidos (spine Billing · Freeze)

### Order (entrada)

| Estado | Permitido como input T1 |
|--------|-------------------------|
| `delivered` | ✅ único |
| Cualquier otro | ❌ |

### InvoiceStatus (as-built enum)

| Status | Rol en FLOW-03 v1 |
|--------|-------------------|
| `pending` | ✅ creado (T1) · puede estar reviewed (`reviewed_at` set) o no |
| `paid` | ✅ terminal PASS (T3) |
| `overdue` | ❌ no happy path |
| `void` | ❌ no happy path |

### Dimensión review (ortogonal al status)

| `reviewed_at` | Lifecycle (derive) | Significado Freeze |
|---------------|--------------------|--------------------|
| `null` | `pending` | Creada · aún no revisada |
| ISO timestamp | `review` | Revisada · lista para cobro (T2 DONE) |

**Importante:** tras T2, `status` sigue siendo `pending` hasta T3.  
“Review” **no** es un valor de `InvoiceStatus`; es el flag `reviewed_at`.

As-built: `src/modules/accounting/` · UI `admin.accounting` · cap `accounting.operate`.

---

## Plantilla canónica por transición

| Elemento | Descripción |
|----------|-------------|
| Estado inicial | … |
| Evento | … |
| Precondiciones | … |
| Acción | … |
| Estado final | … |
| Evidencia | token `FLOW03_*` |
| Criterio PASS | once-only + orden + invariantes |

### T1 · Crear factura

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Pedido(s) `delivered` · aún no facturados |
| **Evento** | Ops Accounting selecciona pedidos y crea factura |
| **Precondiciones** | Tenant activo · `accounting.operate` · `orders.read` · ≥1 order `delivered` · **ningún orderId con factura activa** (invariante 10) |
| **Acción** | `AccountingService.createInvoiceFromOrders` |
| **Estado final** | Invoice `status=pending` · `reviewed_at=null` · `orderIds` trazables |
| **Evidencia** | `FLOW03_T1_STARTED` → `FLOW03_T1_COMPLETED` |
| **Criterio PASS** | Tokens once-only; status ≠ `paid`; orders siguen `delivered` |

### T2 · Revisar factura

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Invoice `status=pending` · `reviewed_at=null` |
| **Evento** | Ops con `accounting.operate` confirma revisión |
| **Precondiciones** | T1 COMPLETED · invoice del pipeline · aún no revisada |
| **Acción** | `AccountingService.reviewInvoice` |
| **Estado final** | `reviewed_at` set · lifecycle `review` · **`status` sigue `pending`** |
| **Evidencia** | `FLOW03_T2_STARTED` → `FLOW03_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only; `reviewed_at != null`; status ≠ `paid`; sin retroceso a `reviewed_at=null` |

### T3 · Registrar cobro

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Invoice `status=pending` · `reviewed_at` set (T2 DONE) |
| **Evento** | Ops registra pago **completo** recibido |
| **Precondiciones** | T2 COMPLETED · invoice revisada |
| **Acción** | `AccountingService.recordPayment` (importe que deja la factura `paid`) |
| **Estado final** | Invoice `status=paid` (terminal) · payment auditado |
| **Evidencia** | `FLOW03_T3_STARTED` → `FLOW03_T3_COMPLETED` |
| **Criterio PASS** | Terminal `paid` · payment record · order statuses intactos · sin tokens posteriores |

---

## Evidencia requerida por transición

| Transición | Tokens obligatorios | Assertions mínimas |
|------------|---------------------|--------------------|
| **T1** | `FLOW03_T1_STARTED` → `FLOW03_T1_COMPLETED` | invoice `pending` · order_ids trazables · orders `delivered` |
| **T2** | `FLOW03_T2_STARTED` → `FLOW03_T2_COMPLETED` | `reviewed_at` set · status ≠ `paid` |
| **T3** | `FLOW03_T3_STARTED` → `FLOW03_T3_COMPLETED` | invoice `paid` · payment record · sin cambio de order status |

Cada token: **exactamente una vez**, en orden global T1→T2→T3.

---

## Invariantes

1. Solo pedidos `delivered` pueden facturarse.  
2. Cada token `FLOW03_T*` se emite **exactamente una vez** por ejecución certificada.  
3. FLOW-03 **no** muta estados Kitchen/Delivery (`confirmed`…`delivered` spine).  
4. No hay cobro (`paid`) sin T1+T2 COMPLETED en el pipeline certificado.  
5. Determinismo: mismo input → misma secuencia de evidencias.  
6. Sin bridge manual (Excel/chat) para cerrar el happy path de Billing.  
7. Void / overdue / reembolso / nota de crédito / pago parcial **no** cuentan como PASS.  
8. `paid` es terminal · no hay tokens FLOW-03 posteriores.  
9. Tras T2, `reviewed_at` no vuelve a `null` en el pipeline certificado.  
10. **1 pedido → 1 factura activa** · segunda creación sobre el mismo order = FAIL (no duplicar).

---

## Contrato de evidencias (listo para Freeze)

```text
FLOW03_T1_STARTED
FLOW03_T1_COMPLETED

FLOW03_T2_STARTED
FLOW03_T2_COMPLETED

FLOW03_T3_STARTED
FLOW03_T3_COMPLETED
```

Reglas (igual que FCR-008 / FLOW-01 / FLOW-02):

- Cada paso **exactamente una vez**, en ese orden  
- `STOP` + `reason` si falla precondición/invariante  
- Evidencia JSON en `docs/10-validation/flow-03/evidence/` (con el runner)  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`  
- Los nombres **no** cambian por refactors de UI  

Opcional envoltura: `FLOW03_START` / `FLOW03_END` en el runner.

---

## Semántica PASS / FAIL / BLOCKED

| Resultado | Significa |
|-----------|-----------|
| **PASS** | Contrato cumplido hasta el `--through` pedido (o FLOW-03 completo en T3) |
| **FAIL** | Brecha de contrato / invariante / evidencia |
| **BLOCKED** | Siguiente transición **aún no implementada** — no es defecto |

### PASS / BLOCKED esperados por fase

| Fase | Runner |
|------|--------|
| Runner recién creado · **0 dominio** | `BLOCKED` · `blocked_at=FLOW03_T1_STARTED` |
| FLOW03-001 (T1) | PASS through T1 · BLOCKED at `FLOW03_T2_STARTED` |
| FLOW03-002 (T2) | PASS through T2 · BLOCKED at `FLOW03_T3_STARTED` |
| FLOW03-003 (T3) | **FLOW-03 PASS** completo · invoice `paid` |

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| Facturar order ≠ `delivered` | Violación invariante 1 |
| Segunda factura sobre el mismo order | Violación invariante 10 (1:1) |
| `FLOW03_T2_COMPLETED` con `reviewed_at=null` | Review no materializado |
| `FLOW03_T3_COMPLETED` con status ≠ `paid` | Violación T3 |
| T3 sin T2 / sin `reviewed_at` | Violación invariante 4 |
| Mutación de order status en T1–T3 | Violación invariante 3 |
| Token duplicado / fuera de orden | Violación evidencia |
| Retroceso `reviewed_at` → null | Violación invariante 9 |
| Solo UI “parece bien” sin tokens | No Done de Flow |

---

## Runner canónico (objetivo post-Freeze · no en este PR)

```text
FLOW03
FLOW03_T1_STARTED
    ↓
FLOW03_T1_COMPLETED
    ↓
FLOW03_T2_STARTED
    ↓
FLOW03_T2_COMPLETED
    ↓
FLOW03_T3_STARTED
    ↓
FLOW03_T3_COMPLETED
    ↓
PASS
```

Comando previsto: `npm run test:flow03-canonical`  
Comportamiento inicial (sin dominio):

```text
FLOW-03
BLOCKED
blocked_at=FLOW03_T1_STARTED
```

Los **invariantes** deben ser assertions del runner.  
**No se implementa en este PR.**

---

## Checklist pre-Freeze

| Elemento | Estado |
|----------|--------|
| Estados permitidos (order + invoice + review) | ✅ § Estados permitidos |
| Qué significa “review” | ✅ `reviewed_at` · status sigue `pending` |
| Q&A Freeze (crear / quién / reverse / paid / exclusiones) | ✅ § Decisiones congeladas |
| Transiciones T1–T3 + precondiciones | ✅ plantilla canónica |
| Estado final por transición | ✅ pending · reviewed · paid |
| Evidencia por transición | ✅ tabla + tokens |
| Invariantes | ✅ 1–9 |
| PASS / BLOCKED / FAIL | ✅ tablas semánticas |
| Eventos / tokens `FLOW03_*` | ✅ contrato T1–T3 |

Si algún ítem quedara abierto → **no Freeze** · no runner.

---

## Definition of Ready (estado)

| Artefacto | Estado |
|-----------|--------|
| SPEC | ✅ listo para Freeze (merge de este PR) |
| Contrato `FLOW03_*` | ✅ congelable |
| Runner `test:flow03-canonical` | ⏳ PR siguiente (post-Freeze) |
| Estados / invariantes / PASS·BLOCKED | ✅ |
| Acta (path) | ⏳ `docs/10-validation/flow-03/` con runner |

**Implementation de dominio:** ❌ prohibida hasta runner + DoR completo (Regla 8).  
Emisión de evidencia en AccountingService = dominio → **después** del runner.

---

## Plan de trabajo

| Fase | Trabajo | Estado |
|------|---------|--------|
| 1 | Spec (este PR) | ▶ → merge = **FROZEN** |
| 2 | Runner canónico (`test:flow03-canonical` · BLOCKED at T1) | ⏳ |
| 3 | FLOW03-001…003 (una transición / PR) | ⏳ |
| 4 | FULL PASS · tag `flow03-pass` | ⏳ |

---

## Fuera de Spec

- Reabrir FLOW-01 / FLOW-02 / FCR-008 salvo regresión  
- Inventory · Support · Order Intake  
- Runner código · implementación de producto en este PR  
- Cierre de periodo (T4) en v1  
