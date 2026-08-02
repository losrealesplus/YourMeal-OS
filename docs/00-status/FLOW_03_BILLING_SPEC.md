# FLOW-03 · Billing · Specification

**Documento:** `FLOW_03_BILLING_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **READY FOR FREEZE** — I7 + review-as-event aprobados · **merge de este PR = FROZEN** · sin runner ni dominio aquí  
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
        │  T1  createInvoiceFromOrders
        ▼
invoice status=pending · reviewed_at=null
        │  T2  reviewInvoice  (evento · no cambia status)
        ▼
invoice status=pending · reviewed_at set
        │  T3  recordPayment
        ▼
invoice status=paid
```

FLOW-01/02 **producen** el input (`delivered`).  
FLOW-03 **certifica** el handoff financiero.

---

## Alcance

**Dentro (v1):**

| Incluye | Notas / as-built |
|---------|------------------|
| Selección de pedidos facturables | Solo `orders.status = delivered` |
| Crear factura | `AccountingService.createInvoiceFromOrders` → invoice `pending` · **idempotente** (FLOW03-I7) |
| Revisar factura | `reviewInvoice` → **evento** auditado (`reviewed_at`) · status sigue `pending` |
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
| Borrado de `reviewed_at` / “unreview” | Prohibido en el happy path certificado (review = evento, no estado reversible) |
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

### ¿Un pedido puede tener varias facturas? (**Opción A + FLOW03-I7 — congelada**)

| Campo | Valor congelado |
|-------|-----------------|
| Regla | **1 pedido `delivered` (o conjunto facturado conjuntamente) → como máximo 1 factura activa** |
| Factura activa | Cualquier invoice vinculada vía `invoice_orders` con `status ≠ void` |
| Idempotencia | `createInvoiceFromOrders` es **idempotente** respecto al origen (ver FLOW03-I7) |
| Segunda llamada con el mismo origen ya facturado | **No crea una nueva** · o bien **devuelve la existente**, o bien **falla** con `DomainError: invoice_already_exists` (o `INVALID_STATE` equivalente) |
| Prohibido | Dos facturas activas para el mismo origen — nunca |
| Billable set | `listBillableOrders` excluye pedidos ya vinculados a factura activa |
| Void + refacturar | ❌ fuera de FLOW-03 v1 (void no es happy path) |

Justificación: evidencia única, transiciones deterministas y ausencia de duplicados. Varias facturas activas por el mismo pedido romperían FLOW-03, conciliación, inventario y auditoría.

#### FLOW03-I7 · Single Active Invoice

```text
FLOW03-I7 · Single Active Invoice

Un pedido (o conjunto de pedidos facturados conjuntamente)
no puede generar más de una factura activa.

createInvoiceFromOrders es idempotente.

Si ya existe una factura activa:
- no crea una nueva,
- devuelve la existente
  (o falla con DomainError: invoice_already_exists).

Nunca existen dos facturas activas para el mismo origen.
```

La implementación elige **una** de las dos salidas no-creadoras (return existing **o** DomainError). Ambas son válidas bajo Freeze; lo inválido es el duplicado activo.

### ¿Qué significa “review”? (**evento, no estado**)

| Campo | Valor congelado |
|-------|-----------------|
| ¿Es un `InvoiceStatus`? | **No** |
| ¿Es un estado del spine? | **No** |
| ¿Qué es? | Un **evento auditado**: `reviewInvoice()` persiste `reviewed_at` |
| Status tras el evento | Permanece **`pending`** hasta T3 |
| Contrato de status | `pending` → (`reviewed_at`) → `pending` → `paid` — **nunca** `pending` → `review` → `paid` |

```text
pending
  ↓
reviewInvoice()     ← evento auditado
  ↓
reviewed_at set
  ↓
pending             ← status no cambia
```

Review **no** representa un estado.  
Review **representa un evento auditado**.  
La factura permanece en `pending`.

Ningún desarrollador debe introducir un valor de enum `review` / `reviewed` en `InvoiceStatus` para este Flow.

### ¿Quién puede emitir el evento review?

| Campo | Valor congelado |
|-------|-----------------|
| Actor | Usuario con capability **`accounting.operate`** (roles Accounting / company_admin según RBAC) |
| Acción canónica | `AccountingService.reviewInvoice(invoiceId)` |
| Efecto | Setea `reviewed_at` (ISO) · lifecycle derive puede mostrar stage `review` · **`status` permanece `pending`** |
| Qué confirma Ops | Importes / líneas / periodo; **no** es cobro ni cambio a `paid` |

### ¿Puede “deshacer” review (borrar `reviewed_at`)?

| Campo | Valor congelado |
|-------|-----------------|
| En FLOW-03 v1 | **No** — no hay transición certificada que borre `reviewed_at` |
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

### Dimensión review (evento auditado · ortogonal al status)

| `reviewed_at` | Lifecycle (derive, UI) | Significado Freeze |
|---------------|------------------------|--------------------|
| `null` | (sin review) | Creada · evento review aún no emitido |
| ISO timestamp | label `review` (derive) | Evento review emitido · lista para cobro (T2 DONE) |

**Contrato de status (único válido en FLOW-03 v1):**

```text
T1  delivered → pending
T2  pending + reviewed_at → pending   (evento; status no muda)
T3  pending → paid
```

**Prohibido como contrato de status:**

```text
pending → review → paid     ❌ inventar estado "review"
```

Tras T2, `status` sigue siendo `pending` hasta T3.  
“Review” **no** es un valor de `InvoiceStatus`; es el timestamp `reviewed_at` de un evento.

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
| **Precondiciones** | Tenant activo · `accounting.operate` · `orders.read` · ≥1 order `delivered` · **ningún orderId con factura activa** (FLOW03-I7 / invariante 10) |
| **Acción** | `AccountingService.createInvoiceFromOrders` (**idempotente** · FLOW03-I7) |
| **Estado final** | Invoice `status=pending` · `reviewed_at=null` · `orderIds` trazables |
| **Evidencia** | `FLOW03_T1_STARTED` → `FLOW03_T1_COMPLETED` |
| **Criterio PASS** | Tokens once-only; status ≠ `paid`; orders siguen `delivered`; **≤1 factura activa por origen** |

### T2 · Evento review (no transición de status)

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Invoice `status=pending` · `reviewed_at=null` |
| **Evento** | Ops con `accounting.operate` emite review (evento auditado) |
| **Precondiciones** | T1 COMPLETED · invoice del pipeline · aún no revisada |
| **Acción** | `AccountingService.reviewInvoice` |
| **Estado final** | `reviewed_at` set · **`status` sigue `pending`** (no existe status `review`) |
| **Evidencia** | `FLOW03_T2_STARTED` → `FLOW03_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only; `reviewed_at != null`; **`status === pending`**; sin retroceso a `reviewed_at=null` |

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
| **T2** | `FLOW03_T2_STARTED` → `FLOW03_T2_COMPLETED` | `reviewed_at` set · **`status === pending`** (evento, no estado) |
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
10. **FLOW03-I7 · Single Active Invoice** — 1 origen → ≤1 factura activa · `createInvoiceFromOrders` idempotente (return existing **o** `invoice_already_exists`) · nunca dos activas.  
11. **Review es evento, no estado** — T2 no introduce `InvoiceStatus=review`; tras T2 `status` permanece `pending`.

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
| Segunda factura activa sobre el mismo origen | Violación FLOW03-I7 / invariante 10 |
| `FLOW03_T2_COMPLETED` con `reviewed_at=null` | Evento review no materializado |
| `FLOW03_T2_COMPLETED` con `status` ≠ `pending` | Inventó estado “review” · violación invariante 11 |
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
| Estados permitidos (order + invoice + review-as-event) | ✅ § Estados permitidos |
| Qué significa “review” | ✅ **evento auditado** · no es `InvoiceStatus` · status sigue `pending` |
| FLOW03-I7 · Single Active Invoice / idempotencia create | ✅ § Decisiones + invariante 10 |
| Q&A Freeze (crear / I7 / review-evento / quién / reverse / paid / exclusiones) | ✅ § Decisiones congeladas |
| Transiciones T1–T3 + precondiciones | ✅ plantilla canónica |
| Estado final por transición | ✅ pending · pending+`reviewed_at` · paid |
| Evidencia por transición | ✅ tabla + tokens |
| Invariantes | ✅ 1–11 (I7 + review-as-event) |
| PASS / BLOCKED / FAIL | ✅ tablas semánticas |
| Eventos / tokens `FLOW03_*` | ✅ contrato T1–T3 cerrado |
| Gate FLOW03-001 (4 condiciones) | ✅ § Gate · Abrir FLOW03-001 |

Si algún ítem quedara abierto → **no Freeze** · no runner.

---

## Definition of Ready (estado)

| Artefacto | Estado |
|-----------|--------|
| SPEC | ✅ **READY FOR FREEZE** (I7 · review-as-event) · merge = **FROZEN** |
| Contrato `FLOW03_*` | ✅ congelado en Spec |
| Runner `test:flow03-canonical` | ⏳ PR siguiente (post-Freeze) · BLOCKED at T1 · sin dominio |
| Estados / invariantes / PASS·BLOCKED | ✅ |
| Acta (path) | ⏳ `docs/10-validation/flow-03/` con runner |

**Implementation de dominio:** ❌ prohibida hasta runner + DoR completo (Regla 8).  
Emisión de evidencia en AccountingService = dominio → **después** del runner.

---

## Gate · Abrir FLOW03-001

FLOW03-001 (dominio T1) **solo** puede abrirse cuando se cumplen **las cuatro** condiciones:

| # | Condición | Verificación |
|---|-----------|--------------|
| 1 | Spec mergeada en `main` | PR Spec = merged → **FLOW-03 FROZEN** |
| 2 | Runner (#156) retarget/rebase a `main` **y** mergeado | `scripts/flow03-canonical.mjs` en `main` |
| 3 | Runner desde `main` en estado inicial canónico | salida exacta abajo · exit **2** |
| 4 | Contrato `FLOW03_T*` sin cambios pendientes | tokens T1–T3 = esta Spec · sin PR de renegociación |

Salida canónica exigida en (3) — ejecutada **desde `main`**:

```bash
npm run test:flow03-canonical
```

```text
FLOW-03
BLOCKED
blocked_at=FLOW03_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Si falta cualquiera → **no abrir** FLOW03-001.

Cuando el gate esté verde, el único objetivo de FLOW03-001 es:

```text
¿T1 quedó certificada?
→ PASS through T1 · BLOCKED at FLOW03_T2_STARTED
```

Separación de responsabilidades (sin mezclar en un mismo PR):

| PR / entrega | Pregunta que responde |
|--------------|----------------------|
| Spec (#155) | ¿Qué debe hacer el flujo? |
| Runner (#156) | ¿Cómo verificamos ese contrato? |
| FLOW03-001 | ¿La primera transición cumple el contrato? |

---

## Plan de trabajo

| Fase | Trabajo | Estado |
|------|---------|--------|
| 1 | Spec (este PR) | ▶ → merge = **FROZEN** |
| 2 | Runner canónico (`test:flow03-canonical` · BLOCKED at T1) | ⏳ |
| 3 | **Gate FLOW03-001** (4 condiciones) | ⏳ |
| 4 | FLOW03-001…003 (una transición / PR) | ⏳ bloqueado por Gate |
| 5 | FULL PASS · tag `flow03-pass` | ⏳ |

---

## Fuera de Spec

- Reabrir FLOW-01 / FLOW-02 / FCR-008 salvo regresión  
- Inventory · Support · Order Intake  
- Runner código · implementación de producto en este PR  
- Cierre de periodo (T4) en v1  
