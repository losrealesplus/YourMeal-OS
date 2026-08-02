# FLOW-04 · Inventory Consumption · Specification

**Documento:** `FLOW_04_INVENTORY_CONSUMPTION_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **CERTIFIED** · tag `flow04-pass` · Spec FROZEN (#163) · FULL PASS  
**Baseline:** Spec merge · DoR [#162](https://github.com/losrealesplus/YourMeal-OS/pull/162)  
**Precondición:** FLOW-01…03 ✅ CERTIFIED · tags `flow01-pass` · `flow02-pass` · `flow03-pass`  
**DoR:** [FLOW_04_INVENTORY_CONSUMPTION_DOR](./FLOW_04_INVENTORY_CONSUMPTION_DOR.md) · [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7–9 · [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)

> Consumo de inventario **desacoplado** del happy path Kitchen→Delivery y de Billing.  
> Certifica que una producción genera un plan de consumo, aplica stock una sola vez  
> y sella el resultado — sin UI de inventario, purchasing ni concurrencia multi-pedido en v1.

---

## Pregunta de Flow

> Tras un Outcome productivo usable (contexto FLOW-01),  
> ¿el stock de ingredientes refleja el consumo de receta de forma trazable,  
> idempotente y con evidencia `FLOW04_*` reproducible?

No: *¿funciona `/admin/inventory`?*  
Sí: *¿el consumo es un contrato verificable de dominio?*

---

## Relación con FLOW-01…03

```text
FLOW-01 Kitchen → Production → …
        │
        ▼
   Production source (dayDate + portions + recipes)
        │
        ▼
FLOW-04 Inventory Consumption
        │  T1  planConsumptionFromProduction
        ▼
consumption.status = planned
        │  T2  applyConsumption
        ▼
consumption.status = applied  ·  stock decrementado
        │  T3  sealConsumption
        ▼
consumption.status = sealed   (terminal)
```

FLOW-01 **produce** el input productivo.  
FLOW-04 **certifica** el handoff de consumo de stock.  
FLOW-02 / FLOW-03 **no** se reabren.

---

## 1. Scope

**Dentro (v1 · happy path):**

| Incluye | Notas |
|---------|-------|
| Fuente productiva única por ejecución | `tenantId` + `deliveryDate` (production day) |
| Plan de consumo desde porciones × `dish_ingredients` | Sin inventar cantidades |
| Aplicación de stock por línea de ingrediente | Decremento determinista |
| Idempotencia de apply (Single Apply) | FLOW04-I2 |
| Sellado terminal del consumo | `sealed` |
| Evidencia `FLOW04_T1…T3_*` | Once-only · orden T1→T3 |

**Fuera (explícito · v1):**

| Excluye | Motivo |
|---------|--------|
| Kitchen / Packaging / Delivery transitions | FLOW-01 / FLOW-02 |
| Billing / invoices / payments | FLOW-03 |
| Purchasing / recepción / suppliers | Flow aparte |
| UI admin inventory / PlaceholderPanel | No es el contrato |
| Concurrencia multi-pedido sobre el mismo ingrediente | Fuera de Spec v1 (ver § Decisiones) |
| Compensaciones / cancelaciones / reverse apply | Fuera de Spec v1 |
| Reintentos de apply tras fallo parcial | Fuera de Spec v1 |
| Stock negativo “permitido” / overdraft | Prohibido (I3) |
| Reorden automático / min_stock como PASS | Observación opcional · no token |
| FLOW-05 Order Lifecycle · FLOW-06 Kitchen Planning | Catálogo aparte |

---

## 2. Business Goal

Un día de producción con recetas conocidas deja el inventario coherente:

1. Se **planifica** el consumo (líneas = ingredientes × qty).  
2. Se **aplica** una sola vez al stock.  
3. Se **sella** el consumo (terminal · sin más mutaciones en este Flow).

Ops puede auditar: qué se consumió, de qué fuente, y que no hubo doble apply.

---

## Decisiones congeladas (Freeze Q&A)

Estas respuestas **no** se reinterpretan en el runner ni en la implementación.

### ¿Cuál es la fuente de consumo?

| Campo | Valor congelado |
|-------|-----------------|
| Fuente | **Production day** identificado por `(tenantId, deliveryDate)` |
| Input | Porciones / platos del informe de producción del día + líneas `dish_ingredients` |
| No es fuente | Pedido suelto sin agregación · factura · incidencia de delivery · UI “ajusté a mano” sin plan |

### ¿Qué entidad certifica el Flow?

| Campo | Valor congelado |
|-------|-----------------|
| Entidad | **InventoryConsumption** (nombre canónico de Spec) |
| Identidad | Una por `(tenantId, deliveryDate)` en el happy path v1 |
| Acción canónica (nombres) | `planConsumptionFromProduction` · `applyConsumption` · `sealConsumption` |
| Módulo | Inventory / Operations — **nombre de servicio se fija en implementación**; el contrato de estados/tokens no |

### ¿Cómo se calculan las cantidades? (**no inventar**)

| Campo | Valor congelado |
|-------|-----------------|
| Fórmula | Σ (portionQty × recipeLine.qty) por `ingredientId` (+ unit) |
| Receta | `dish_ingredients` (as-built) |
| Si falta receta para un plato del día | Ese plato **no aporta** líneas (no se inventan); Spec v1 exige al menos **una** línea planificada para PASS de T1 |
| Override manual de qty | ❌ fuera del happy path certificado |

### FLOW04-I2 · Single Apply

```text
FLOW04-I2 · Single Apply

Un InventoryConsumption no puede aplicar stock dos veces.

applyConsumption es idempotente respecto al consumptionId:

- si status ya es applied o sealed → no vuelve a decrementar stock;
  devuelve el existente o DomainError: consumption_already_applied
- nunca doble decremento para la misma fuente
```

### ¿Stock negativo?

| Campo | Valor congelado |
|-------|-----------------|
| Política v1 | **Rechazar** apply si algún `stock - qty < 0` |
| Error | `DomainError: insufficient_stock` (o equivalente) |
| PASS | Imposible con stock negativo tras T2 |

### ¿Casos complejos (concurrencia, cancelaciones, compensaciones)?

| Campo | Valor congelado |
|-------|-----------------|
| En FLOW-04 v1 | ❌ **fuera de Spec** |
| Motivo | Mantener una pregunta verificable por PR (happy path) |
| Futuro | Nuevo Flow o ampliación de versión con evidencia de necesidad |

### ¿`sealed` es terminal?

| Campo | Valor congelado |
|-------|-----------------|
| Sí | `status=sealed` es **terminal** del happy path FLOW-04 v1 |
| Tras `sealed` | No hay más tokens `FLOW04_*` · no mutación de stock de este consumption |

---

## 3. Canonical transitions

```text
T1  production source → consumption.status = planned
T2  planned → applied  (+ stock decrement)
T3  applied → sealed
```

---

## 4. States

### InventoryConsumptionStatus (Freeze)

| Status | Rol en FLOW-04 v1 |
|--------|-------------------|
| `planned` | ✅ creado (T1) · líneas calculadas · stock **aún no** mutado |
| `applied` | ✅ stock decrementado (T2) |
| `sealed` | ✅ terminal PASS (T3) |

**Prohibido inventar** otros status en el happy path (`draft`, `partial`, `reversed`, …).

### Ingredient stock (campos observados)

| Campo | Rol |
|-------|-----|
| `stock` | Numérico · mutado solo en T2 |
| `min_stock` | Existente · **no** es criterio PASS de FLOW-04 v1 |

### Contrato de status

```text
T1  → planned
T2  planned → applied
T3  applied → sealed
```

---

## Plantilla canónica por transición

| Elemento | Descripción |
|----------|-------------|
| Estado inicial | … |
| Evento | … |
| Precondiciones | … |
| Acción | … |
| Estado final | … |
| Evidencia | token `FLOW04_*` |
| Criterio PASS | once-only + orden + invariantes |

### T1 · Planificar consumo

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Production day `(tenantId, deliveryDate)` con porciones y ≥1 receta usable · sin consumption activo para esa fuente |
| **Evento** | Ops / sistema solicita plan de consumo del día |
| **Precondiciones** | Tenant activo · capability inventory (p. ej. `inventory.operate`) · fuente productiva válida · **ningún** consumption `planned|applied|sealed` previo para la misma fuente (o idempotencia de plan: return existing `planned`) |
| **Acción** | `planConsumptionFromProduction({ tenantId, deliveryDate })` |
| **Estado final** | `InventoryConsumption.status=planned` · ≥1 línea `(ingredientId, qty, unit)` · stock **sin** cambio |
| **Evidencia** | `FLOW04_T1_STARTED` → `FLOW04_T1_COMPLETED` |
| **Criterio PASS** | Tokens once-only; status=`planned`; líneas no vacías; stock intacto |

### T2 · Aplicar consumo a stock

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Consumption `status=planned` |
| **Evento** | Ops confirma apply |
| **Precondiciones** | T1 COMPLETED · suficiente stock por línea (I3) · no applied previo (I2) |
| **Acción** | `applyConsumption(consumptionId)` (**idempotente** · FLOW04-I2) |
| **Estado final** | `status=applied` · cada línea decrementó `stock` exactamente una vez |
| **Evidencia** | `FLOW04_T2_STARTED` → `FLOW04_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only; status=`applied`; stock final = stock previo − plan; sin negativos |

### T3 · Sellar consumo

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Consumption `status=applied` |
| **Evento** | Ops sella / cierra el consumo del día |
| **Precondiciones** | T2 COMPLETED · consumption del pipeline |
| **Acción** | `sealConsumption(consumptionId)` |
| **Estado final** | `status=sealed` (terminal) · sin más mutación de stock de este consumption |
| **Evidencia** | `FLOW04_T3_STARTED` → `FLOW04_T3_COMPLETED` |
| **Criterio PASS** | Terminal `sealed` · stock estable respecto a T2 · sin tokens posteriores |

---

## 5. Invariants

1. Solo una fuente `(tenantId, deliveryDate)` por consumption en el happy path v1.  
2. **FLOW04-I2 · Single Apply** — apply idempotente · nunca doble decremento.  
3. **No negative stock** — apply rechaza si algún `stock - qty < 0`.  
4. Cantidades del plan derivadas de porciones × `dish_ingredients` — no inventar.  
5. T2 **no** muta status de orders / kitchen batches / invoices.  
6. Cada token `FLOW04_T*` exactamente una vez por ejecución certificada · orden T1→T3.  
7. Determinismo: mismo input → misma secuencia de evidencias.  
8. Sin bridge manual (Excel) para cerrar el happy path certificado.  
9. Compensaciones / cancelaciones / reverse / concurrency races **no** cuentan como PASS.  
10. `sealed` es terminal · no hay tokens FLOW-04 posteriores.  
11. T1 no muta `stock`; solo T2 decrementa.

---

## 6. Canonical tokens

```text
FLOW04_T1_STARTED
FLOW04_T1_COMPLETED

FLOW04_T2_STARTED
FLOW04_T2_COMPLETED

FLOW04_T3_STARTED
FLOW04_T3_COMPLETED
```

Reglas (igual que FLOW-01…03):

- Cada paso **exactamente una vez**, en ese orden  
- `STOP` + `reason` si falla precondición/invariante  
- Evidencia JSON en `docs/10-validation/flow-04/evidence/` (con el runner)  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`  
- Los nombres **no** cambian por refactors de UI  

---

## 7. PASS expectations

| Fase | Runner |
|------|--------|
| FLOW04-001 (T1) | PASS through T1 · BLOCKED at `FLOW04_T2_STARTED` |
| FLOW04-002 (T2) | PASS through T2 · BLOCKED at `FLOW04_T3_STARTED` |
| FLOW04-003 (T3) | **FLOW-04 PASS** completo · consumption `sealed` |

FULL PASS:

```text
FLOW-04
PASS
… FLOW04_T1_STARTED … FLOW04_T3_COMPLETED …
duplicates=[]
missing=[]
out_of_order=[]
```

Tag futuro: `flow04-pass` — solo tras acta + `--live` PASS.

---

## 8. BLOCKED expectations

| Resultado | Significa |
|-----------|-----------|
| **BLOCKED** | Siguiente transición **aún no implementada** — no es defecto |
| **FAIL** | Contrato implementado roto |

### Baseline runner (post-Freeze · Runner PR · 0 dominio)

```bash
npm run test:flow04-canonical
```

```text
FLOW-04
BLOCKED
blocked_at=FLOW04_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code esperado: **2** (BLOCKED).

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| T1 con 0 líneas | Violación precondición plan |
| T2 decrementa dos veces la misma fuente | Violación FLOW04-I2 |
| T2 con `stock < 0` | Violación I3 |
| T2 muta order/invoice status | Violación invariante 5 |
| T3 sin T2 / status ≠ `sealed` | Violación T3 |
| Token duplicado / fuera de orden | Violación evidencia |
| Solo UI “parece bien” sin tokens | No Done de Flow |

---

## 9. Evidence per transition

| Transición | Tokens | Assertions mínimas |
|------------|--------|--------------------|
| **T1** | `FLOW04_T1_STARTED` → `FLOW04_T1_COMPLETED` | status=`planned` · ≥1 línea · stock intacto · fuente `(tenantId, deliveryDate)` |
| **T2** | `FLOW04_T2_STARTED` → `FLOW04_T2_COMPLETED` | status=`applied` · stock = previo − plan · sin negativos · I2 |
| **T3** | `FLOW04_T3_STARTED` → `FLOW04_T3_COMPLETED` | status=`sealed` · stock estable vs T2 · terminal |

---

## 10. Gate before Runner / FLOW04-001

### Gate · Runner (tras Freeze de esta Spec)

Runner PR **solo** pipeline. Prohibido: repositories · services · Supabase · UI · RPC · stock mutation.

### Gate · Abrir FLOW04-001

FLOW04-001 (dominio T1) **solo** cuando se cumplen **las cuatro**:

| # | Condición | Verificación |
|---|-----------|--------------|
| 1 | Spec mergeada en `main` | Este doc → **FLOW-04 FROZEN** |
| 2 | Runner mergeado en `main` | `scripts/flow04-canonical.mjs` (o equivalente) en `main` |
| 3 | Runner desde `main` en estado inicial canónico | salida BLOCKED exacta (§8) · exit **2** |
| 4 | Contrato `FLOW04_T*` sin cambios pendientes | tokens T1–T3 = esta Spec · sin PR de renegociación |

Cuando el gate esté verde, la única pregunta de FLOW04-001:

```text
¿T1 quedó certificada?
→ PASS through T1 · BLOCKED at FLOW04_T2_STARTED
```

---

## Checklist pre-Freeze

| Elemento | Estado |
|----------|--------|
| Scope / Business Goal | ✅ |
| Transiciones T1–T3 | ✅ |
| States `planned → applied → sealed` | ✅ |
| Invariants 1–11 · FLOW04-I2 · no negative stock | ✅ |
| Tokens `FLOW04_T*_STARTED\|COMPLETED` | ✅ |
| PASS / BLOCKED / FAIL | ✅ |
| Evidence per transition | ✅ |
| Gate before Runner / FLOW04-001 | ✅ |
| Complejidad (concurrency / cancel / compensate) | ✅ **excluida** de v1 |

Si algún ítem quedara abierto → **no Freeze** · no runner.

---

## Definition of Ready (estado)

| Artefacto | Estado |
|-----------|--------|
| DoR document | ✅ [#162](https://github.com/losrealesplus/YourMeal-OS/pull/162) · `9ce3feb` |
| SPEC | ✅ **FROZEN** (#163 → `3d922ae`) |
| Contrato `FLOW04_*` | ✅ congelado |
| Runner `test:flow04-canonical` | ▶ [FLOW04_CANONICAL_RUNNER](../10-validation/flow-04/FLOW04_CANONICAL_RUNNER.md) |
| Gate FLOW04-001 | ▶ tras Runner en `main` + BLOCKED verificado |
| Estados / invariantes / PASS·BLOCKED | ✅ |
| Acta runner | ▶ `docs/10-validation/flow-04/FLOW04_CANONICAL_RUNNER.md` |

**Implementation de dominio:** ❌ prohibida hasta Gate FLOW04-001 verde.

---

## Plan de trabajo

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document (#162) | ✅ |
| 1 | Spec | ✅ FROZEN (#163) |
| 2 | Freeze (merge Spec → `main`) | ✅ `3d922ae` |
| 3 | Runner only · BLOCKED at T1 | ▶ |
| 4 | Gate FLOW04-001 | ⏳ |
| 5 | FLOW04-001…003 (una transición / PR) | ⏳ |
| 6 | FULL PASS · tag `flow04-pass` | ⏳ |

---

## Fuera de este PR

- Runner código · drivers · `npm run test:flow04-*`  
- Repositories · InventoryService · OperationsService · stock mutation  
- Supabase · RPC · SQL / migraciones · UI  
- Casos de concurrencia / cancelación / compensación  
- RELEASE-01 Freeze · DoRl PASS · FLOW-05 / FLOW-06  

---

## End of FLOW-04 Specification
