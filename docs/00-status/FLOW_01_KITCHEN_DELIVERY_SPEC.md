# FLOW-01 · Kitchen → Delivery · Specification

**Documento:** `FLOW_01_KITCHEN_DELIVERY_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **SPEC IN PROGRESS** — sin implementación de producto en este PR  
**Precondición de plataforma:** PS-002-C ✅ PASS · tag `ps002c-pass` → `545bd19` · [PS002C_PASS_ACTA](../10-validation/platform-stabilization/PS002C_PASS_ACTA.md)  
**Auth:** [FCR-008](../10-validation/FCR008_CANONICAL_POST_LOGIN_SESSION.md) **FROZEN** (solo se reabre por regresión certificada)  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [FLOW_FIRST](./FLOW_FIRST.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md)  
**Framing:** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)

> Objetivo: definir el handoff operativo **antes de código**, con la misma disciplina que FCR-008:  
> estados · eventos · precondiciones · acción · estado final · evidencia · criterios PASS.

---

## Pregunta de Flow

> ¿Kitchen entrega correctamente a Delivery (y la cadena Production → Packaging intermedia)  
> sin pérdida de información, sin intervención manual indebida y con trazabilidad?

No: *¿funciona la pantalla de cocina?*  
Sí: *¿el Outcome de Kitchen es consumible por Delivery?*

---

## Alcance de cadena (piloto EatClean)

```text
Kitchen
   ↓  T1
Production
   ↓  T2
Packaging
   ↓  T3
Delivery
   ↓  T4 (consumo Outcome)
```

| Etapa | Workspace / Journey (ref.) | Rol típico |
|-------|----------------------------|------------|
| Kitchen / Production | Kitchen Journey (EP-OPS-003) | `kitchen` / production |
| Packaging | Kitchen / Ops (etapa a fijar — puede vivir en Kitchen) | kitchen / logistics |
| Delivery | Delivery Journey (EP-OPS-003) | `delivery` / logistics |

**Fuera de FLOW-01 (por ahora):** Customer order intake · Support · Accounting · SaaS admin · Auth.

**En paralelo (no bloquea Spec ni se bloquean mutuamente):** BR-03.3 Runtime Validation  
(FLOW-01 = ¿el negocio es correcto? · BR-03.3 = ¿el runtime sigue sano mientras evoluciona?)

---

## Cadena de certificación (filosofía FCR-008)

```text
Handoff definido
    ↓
Evidence reproducible (automatizada preferida)
    ↓
Flow certificado
    ↓
Merge de implementación
```

Cada transición Tₙ debe emitir evidencia observable (log estructurado / assertion de estado / test de contrato), no solo “probado a mano”.

---

## Plantilla canónica por transición

**Todas** las transiciones T1–T4 usan exactamente esta estructura:

| Elemento | Descripción |
|----------|-------------|
| **Estado inicial** | Estado del dominio al entrar en la transición |
| **Evento** | Qué dispara la transición |
| **Precondiciones** | Qué debe ser cierto antes de actuar |
| **Acción** | Operación de dominio (servicio / RPC propuesto) |
| **Estado final** | Estado del dominio al salir |
| **Evidencia** | Token `FLOW01_T*_…` emitido una sola vez |
| **Criterio PASS** | Evidencia once-only + en orden + invariantes OK |

---

## Transiciones T1–T4

### T1 · Kitchen → Production

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Pedido confirmado (`orders.status = confirmed`) listo para producir |
| **Evento** | Cocina inicia producción |
| **Precondiciones** | Tenant activo · rol kitchen/production · pedido confirmado · ítems/receta válidos · menú/slot del día disponible |
| **Acción** | `startProduction` — abrir lote / marcar pedido en producción |
| **Estado final** | Producción iniciada (`in_production` y/o batch `preparing`) |
| **Evidencia** | `FLOW01_T1_STARTED` → (trabajo) → `FLOW01_T1_COMPLETED` |
| **Criterio PASS** | Ambos tokens una vez, en orden; `order_id` / cantidades / `tenant_id` conservados |

### T2 · Production → Packaging

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Producción completada para el alcance del lote/pedido |
| **Evento** | Producción marca listo para empaquetar |
| **Precondiciones** | T1 COMPLETED · lote/ítems producidos · sin faltantes no resueltos |
| **Acción** | `completeProduction` luego `startPackaging` |
| **Estado final** | Empaquetado iniciado / cola packaging alimentada (`prepared` o equivalente) |
| **Evidencia** | `FLOW01_T2_STARTED` → `FLOW01_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only en orden; trazabilidad lote → pedidos; sin doble conteo |

### T3 · Packaging → Delivery (handoff primario)

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Empaquetado en curso / packs listos |
| **Evento** | Packaging completa y entrega a dispatch |
| **Precondiciones** | T2 COMPLETED · datos de entrega presentes (dirección / ventana / grupo) |
| **Acción** | `completePackaging` luego `assignDelivery` |
| **Estado final** | Listo para entrega / asignado a ruta (`ready_for_delivery` + stop/ruta) |
| **Evidencia** | `FLOW01_T3_STARTED` → `FLOW01_T3_COMPLETED` |
| **Criterio PASS** | Tokens once-only en orden; Delivery puede operar sin preguntar a Kitchen |

### T4 · Delivery (consumo Outcome)

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Pedido asignado / visible en cola Delivery |
| **Evento** | Reparto inicia o completa entrega (alcance mínimo FLOW-01: consumo + cierre operable) |
| **Precondiciones** | T3 COMPLETED · rol delivery · ruta/orden visible |
| **Acción** | `completeDelivery` (y opcionalmente inicio de ruta vía estado `out_for_delivery`) |
| **Estado final** | Outcome Delivery consumido (`out_for_delivery` y/o `delivered` según criterio de Spec freeze) |
| **Evidencia** | `FLOW01_T4_STARTED` → `FLOW01_T4_COMPLETED` |
| **Criterio PASS** | Tokens once-only en orden; Delivery solo consume Outcomes de Packaging; no inventa pedidos |

---

## Invariantes del flujo

Reglas globales (aplican a toda la cadena; violación = FAIL de FLOW-01):

1. **Orden de etapas:** un pedido **nunca** pasa a Packaging sin haber completado Production (T1→T2).  
2. **Exclusión de fases:** un lote/pedido **no** puede estar simultáneamente en Production y Delivery.  
3. **Evidencia única:** cada token `FLOW01_T*_STARTED|COMPLETED` se emite **exactamente una vez** por ejecución certificada.  
4. **Sin retroceso silencioso:** no hay transiciones hacia atrás salvo un **flujo explícito de incidencias** (fuera de FLOW-01 v1, o Spec aparte).  
5. **Determinismo:** cada evidencia es determinista y repetible (mismo input → misma secuencia).  
6. **Trazabilidad:** `tenant_id`, `order_id` (y refs de lote/ruta cuando existan) se conservan en cada handoff.  
7. **Sin bridge manual:** Excel/chat/reconstrucción humana para completar el handoff = Flow Gap (FAIL).  
8. **Consumo, no invención:** Delivery no crea pedidos; solo consume Outcomes de Packaging/Kitchen.

---

## Freeze previo a implementación

Antes de escribir código de producto, congelar estos tres contratos.

### 1. Entidades (contrato Spec)

| Entidad Spec | Rol en el flujo | As-built EatClean (hoy) | Estado freeze |
|--------------|-----------------|-------------------------|---------------|
| **Order** | Unidad de trabajo atravesando T1–T4 | `orders` + `order_items` · `OperationalOrderStatus` | ✅ existe |
| **ProductionBatch** | Lote de cocina / producción | `kitchen_production_batches` · `KitchenBatchStatus` | 🟡 parcial (nombre/status a alinear) |
| **PackagingBatch** | Unidad de empaquetado | — (UI/mock; sin tabla) | ❌ gap — definir en Spec/impl |
| **DeliveryRoute** | Ruta de reparto | `routes` (+ `route_stops`) | ✅ existe |
| **DeliveryAssignment** | Asignación pedido→ruta/conductor | implícito en `route_stops` + `routes.driver_id` | 🟡 parcial — decidir si entidad 1ª clase |

**Spine de status de pedido (referencia as-built):**  
`confirmed → in_production → prepared → ready_for_delivery → out_for_delivery → delivered`  
(Packaging puede mapear a `prepared` / `ready_for_delivery` hasta existir `PackagingBatch`.)

### 2. RPCs / servicios (contrato Spec)

| Operación Spec | Intención | As-built más cercano | Estado freeze |
|----------------|-----------|----------------------|---------------|
| `startProduction` | Abrir producción | `KitchenExecutionService.transitionBatch` / `OperationsService.transitionKitchen` | 🟡 adaptar o envolver |
| `completeProduction` | Cerrar producción | idem + `transition_order_status` | 🟡 |
| `startPackaging` | Abrir empaquetado | — | ❌ gap |
| `completePackaging` | Cerrar empaquetado | — / status order | ❌ gap |
| `assignDelivery` | Asignar a ruta/parada | `RouteService.addStop` / `setDriver` | 🟡 |
| `completeDelivery` | Cerrar entrega | `DeliveryService.recordAttempt` + `transition_order_status` | 🟡 |

Las pruebas de certificación **no** dependen del nombre de un componente UI; pueden llamar al servicio/RPC canónico o asertar el efecto + evidencia.

### 3. Contrato de evidencias (congelado para Spec)

```text
FLOW01_T1_STARTED
FLOW01_T1_COMPLETED

FLOW01_T2_STARTED
FLOW01_T2_COMPLETED

FLOW01_T3_STARTED
FLOW01_T3_COMPLETED

FLOW01_T4_STARTED
FLOW01_T4_COMPLETED
```

Reglas del contrato:

- Cada paso **exactamente una vez**, en ese orden  
- `STOP` + `reason` si falla precondición/invariante  
- Evidencia JSON comparable (estilo `ps002c-canonical-auth.json`)  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`  
- Los nombres **no** cambian por refactors de UI/función

Opcional de envoltura (no sustituye T1–T4): `FLOW01_START` / `FLOW01_END` en el runner.

---

## Criterios FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| Delivery no ve pedidos empaquetados | Flow Gap (no Surface Gap de Kitchen) |
| Cantidades / refs rotas en el traspaso | Invariante de trazabilidad |
| Pedido en Packaging sin T1/T2 COMPLETED | Violación de orden de etapas |
| Requiere chat/Excel/manual bridge | Handoff no operacional |
| Solo UI “parece bien” sin evidencia | No Done de Flow |
| Doble emisión de un token `FLOW01_*` | Violación de evidencia única |

---

## Fuera de Spec (explícito)

- Reabrir Auth / PS-002-C / **FCR-008** salvo **regresión** demostrada  
- Event Bus · Notifications · Jobs · Analytics · AI  
- Certificar pantallas como PASS de Flow  
- Implementación de producto en este PR  

---

## Plan de trabajo (hoja de ruta)

| # | Paso | Estado |
|---|------|--------|
| 1 | Merge PR #140 (acta PS-002-C) | ✅ MERGED |
| 2 | Verificar tag `ps002c-pass` → `545bd19` | ✅ |
| 3 | `CURRENT_PHASE` = Stabilization COMPLETE (Flow-ready) | ✅ en `main` |
| 4 | Congelar plantilla T1–T4 + invariantes + evidencias (este doc) | ▶ este PR |
| 5 | Congelar mapeo entidades / RPCs (cerrar gaps Packaging) | ⏳ Spec follow-up |
| 6 | Definir runner `test:flow01-canonical` (contrato) | ⏳ tras freeze |
| 7 | Implementación Kitchen → Delivery | ❌ solo después del freeze |

---

## Definition of Done (este documento)

| Criterio | Estado |
|----------|--------|
| Handoff Kitchen→Delivery nombrado | ✅ |
| Cadena Kitchen→…→Delivery descrita | ✅ |
| Plantilla uniforme T1–T4 | ✅ |
| Invariantes del flujo | ✅ |
| Entidades / RPCs / evidencias propuestos | ✅ (gaps Packaging explícitos) |
| Implementación producto | ❌ no en este PR |
| Certificación FLOW-01 | ⏳ tras Spec freeze + Evidence + impl |

**Siguiente iteración de Spec:** cerrar gaps `PackagingBatch` / `startPackaging` / `completePackaging` y fijar status exactos de T4 (`out_for_delivery` vs `delivered`) antes de código.
