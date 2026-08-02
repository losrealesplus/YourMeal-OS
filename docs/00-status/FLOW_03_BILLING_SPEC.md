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
| Cierre de periodo financiero (`closeFinancialPeriod`) | Follow-up / T4 opcional post-PASS |
| Cobro en app del cliente / pasarela externa | Fuera de certificación operativa EatClean v1 |
| Nueva entidad Billing aparte de `invoices`/`payments` | Usar as-built Accounting |

---

## Estados (spine Billing)

| Estado | Rol en FLOW-03 |
|--------|----------------|
| Order `delivered` (no facturado) | Entrada / billable |
| Invoice `pending` | Factura creada |
| Invoice reviewed (`reviewed_at` / lifecycle `review`) | Lista para cobro |
| Invoice `paid` | Resolución financiera v1 |

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
| **Precondiciones** | Tenant activo · `accounting.operate` · `orders.read` · ≥1 order `delivered` |
| **Acción** | `AccountingService.createInvoiceFromOrders` |
| **Estado final** | Invoice `pending` · líneas vinculadas a order_ids |
| **Evidencia** | `FLOW03_T1_STARTED` → `FLOW03_T1_COMPLETED` |
| **Criterio PASS** | Tokens once-only; **no** marca invoice `paid`; orders siguen `delivered` |

### T2 · Revisar factura

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Invoice `pending` |
| **Evento** | Ops marca revisión completa |
| **Precondiciones** | T1 COMPLETED · invoice existente |
| **Acción** | `AccountingService.reviewInvoice` |
| **Estado final** | Invoice revisada (`reviewed_at` / lifecycle `review`) · status sigue `pending` hasta cobro |
| **Evidencia** | `FLOW03_T2_STARTED` → `FLOW03_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only; **no** emite `paid` |

### T3 · Registrar cobro

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Invoice revisada (T2 COMPLETED) |
| **Evento** | Ops registra pago recibido |
| **Precondiciones** | T2 COMPLETED |
| **Acción** | `AccountingService.recordPayment` |
| **Estado final** | Invoice `paid` · payment auditado |
| **Evidencia** | `FLOW03_T3_STARTED` → `FLOW03_T3_COMPLETED` |
| **Criterio PASS** | Terminal invoice `paid` · sin mutar Kitchen/Delivery statuses |

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
7. Void / overdue **no** cuentan como PASS de FLOW-03 v1.

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
| `FLOW03_T3_COMPLETED` con status ≠ `paid` | Violación T3 |
| Mutación de order status en T1–T3 | Violación invariante 3 |
| Token duplicado / fuera de orden | Violación evidencia |
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
| Estados del flujo | ✅ delivered → pending → reviewed → paid |
| Transiciones T1–T3 | ✅ plantilla canónica |
| Invariantes | ✅ 1–7 |
| Eventos / tokens `FLOW03_*` | ✅ contrato T1–T3 |
| PASS esperado | ✅ por fase + FULL en T3 |
| BLOCKED esperado | ✅ runner vacío en T1 · parcial en T2/T3 |
| Evidencia requerida por transición | ✅ tabla dedicada |

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
