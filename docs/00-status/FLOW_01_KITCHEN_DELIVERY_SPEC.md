# FLOW-01 · Kitchen → Delivery · Specification

**Documento:** `FLOW_01_KITCHEN_DELIVERY_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **SPEC FROZEN** (PR #141 merged · 2026-08-02) · runner canónico siguiente · sin happy-path de dominio hasta runner  
**Fase de proyecto:** **Fase 1 · Domain / Flow Certification** (Fase 0 · Plataforma = COMPLETE)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7  
**Precondición de plataforma:** PS-002-C ✅ PASS · tag `ps002c-pass` → `545bd19` · [PS002C_PASS_ACTA](../10-validation/platform-stabilization/PS002C_PASS_ACTA.md)  
**Auth:** [FCR-008](../10-validation/FCR008_CANONICAL_POST_LOGIN_SESSION.md) **FROZEN** (solo se reabre por regresión certificada)  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [FLOW_FIRST](./FLOW_FIRST.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md)  
**Framing:** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · [FLOW_CATALOG](./FLOW_CATALOG.md) · [DELIVERY_JOURNEY](../10-validation/ep-ops-003/delivery/DELIVERY_JOURNEY.md)

> Objetivo: definir el handoff operativo **antes de código**, con la misma disciplina que FCR-008:  
> estados · eventos · precondiciones · acción · estado final · evidencia · criterios PASS.

---

## Cambio de fase (oficial)

| Fase | Contenido | Estado |
|------|-----------|--------|
| **0 · Plataforma** | Foundation · Auth · Bootstrap · PO · PS-002-C · FCR-008 · Stabilization | ✅ COMPLETE |
| **1 · Domain / Flow** | FLOW-01 Kitchen → Delivery (Spec → Evidence → Certification) | ▶ ACTIVA |

La plataforma **deja de ser el cuello de botella**. Las próximas decisiones giran en torno a procesos de negocio deterministas, trazables y certificables — no a cómo autenticar un usuario.

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
   ↓  T4 (consumo Outcome → delivered)
```

| Etapa | Workspace / Journey (ref.) | Rol típico |
|-------|----------------------------|------------|
| Kitchen / Production | Kitchen Journey (EP-OPS-003) | `kitchen` / production |
| Packaging | Kitchen / Ops | kitchen / logistics |
| Delivery | Delivery Journey (EP-OPS-003) | `delivery` / logistics |

**Fuera de FLOW-01 (por ahora):** Customer order intake · Support · Accounting · SaaS admin · Auth · facturación.

**En paralelo (no se bloquean):** BR-03.3 Runtime Validation  
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
| **Evidencia** | `FLOW01_T1_STARTED` → `FLOW01_T1_COMPLETED` |
| **Criterio PASS** | Ambos tokens una vez, en orden; `order_id` / cantidades / `tenant_id` conservados |

### T2 · Production → Packaging

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Producción completada para el alcance del lote/pedido |
| **Evento** | Producción marca listo para empaquetar |
| **Precondiciones** | T1 COMPLETED · lote/ítems producidos · sin faltantes no resueltos |
| **Acción** | `completeProduction` luego `startPackaging` (`PackagingBatch` → `CREATED` / `IN_PROGRESS`) |
| **Estado final** | Empaquetado iniciado · order `prepared` · batch packaging `IN_PROGRESS` |
| **Evidencia** | `FLOW01_T2_STARTED` → `FLOW01_T2_COMPLETED` |
| **Criterio PASS** | Tokens once-only en orden; trazabilidad lote → pedidos; sin doble conteo |

### T3 · Packaging → Delivery (handoff primario)

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | `PackagingBatch` en `IN_PROGRESS` o `READY` |
| **Evento** | Packaging cierra lote y entrega a dispatch |
| **Precondiciones** | T2 COMPLETED · datos de entrega presentes (dirección / ventana / grupo) · batch `READY` o transición a `CLOSED` |
| **Acción** | `completePackaging` (`CLOSED`) luego `assignDelivery` |
| **Estado final** | Order `ready_for_delivery` · asignación a ruta/parada · Delivery puede operar sin Kitchen |
| **Evidencia** | `FLOW01_T3_STARTED` → `FLOW01_T3_COMPLETED` |
| **Criterio PASS** | Tokens once-only en orden; handoff consumible por Delivery Journey |

### T4 · Delivery (consumo Outcome) — criterio congelado

| Elemento | Definición |
|----------|------------|
| **Estado inicial** | Pedido `ready_for_delivery` asignado / visible en cola Delivery |
| **Evento** | Reparto inicia ruta y **confirma entrega al cliente** |
| **Precondiciones** | T3 COMPLETED · rol delivery · ruta/orden visible |
| **Acción** | Inicio: transición a `out_for_delivery` · Cierre: `completeDelivery` → `delivered` |
| **Estado final** | **`orders.status = delivered`** (Outcome Delivery Journey) |
| **Evidencia** | `FLOW01_T4_STARTED` (= sale a ruta / `out_for_delivery`) → `FLOW01_T4_COMPLETED` (= **entrega confirmada**) |
| **Criterio PASS** | Tokens once-only en orden; estado terminal del Flow = `delivered` |

#### Qué significa `FLOW01_T4_COMPLETED` (congelado)

| Interpretación | ¿Es T4 COMPLETED? |
|----------------|-------------------|
| Sale el repartidor / `out_for_delivery` | ❌ Solo `FLOW01_T4_STARTED` |
| Pedido llega al vehículo / cargado | ❌ No es hito de evidencia FLOW-01 |
| Cliente firma / se confirma la entrega | ✅ **`FLOW01_T4_COMPLETED`** · `status = delivered` |
| Pedido queda facturado | ❌ Fuera de FLOW-01 (Accounting / FLOW posterior) |

Alineado a [DELIVERY_JOURNEY](../10-validation/ep-ops-003/delivery/DELIVERY_JOURNEY.md):  
`Orders Delivered = order.status = delivered`.

---

## GAP 1 cerrado · PackagingBatch (ciclo de vida)

Entidad Spec **congelada** (puede no existir aún en DB; la impl debe respetar este ciclo):

```text
PackagingBatch
CREATED
   ↓
IN_PROGRESS
   ↓
READY
   ↓
CLOSED
```

| Estado | Significado | Relación con Order (as-built) |
|--------|-------------|-------------------------------|
| `CREATED` | Lote de empaquetado abierto tras Production | tras `completeProduction` · order → `prepared` |
| `IN_PROGRESS` | Empaquetando | `prepared` |
| `READY` | Packs listos; pendiente handoff a Delivery | previo a `ready_for_delivery` |
| `CLOSED` | Handoff hecho; batch no acepta más ítems | order → `ready_for_delivery` (+ assign) |

**Reglas Packaging:**

- No se crea `PackagingBatch` sin T1 COMPLETED / Production completa del alcance.  
- `CLOSED` es terminal para el batch en FLOW-01 v1 (reempaquetar = excepción, ver abajo).  
- `startPackaging` → `CREATED`/`IN_PROGRESS` · `completePackaging` → `READY`→`CLOSED` (o `READY` luego `CLOSED` en el mismo handoff T3).

---

## GAP 2 cerrado · Criterio T4

**Congelado:** T4 termina cuando la entrega al cliente está **confirmada** (`delivered`).  
No cuando sale el repartidor, no cuando se carga el vehículo, no cuando se factura.

---

## Invariantes del flujo

Reglas globales (aplican a toda la cadena; violación = FAIL de FLOW-01).  
Deben convertirse en aserciones del runner canónico.

1. **Orden de etapas:** un pedido **nunca** pasa a Packaging sin haber completado Production (T1→T2).  
2. **Exclusión de fases:** un lote/pedido **no** puede estar simultáneamente en Production y Delivery.  
3. **Evidencia única:** cada token `FLOW01_T*_STARTED|COMPLETED` se emite **exactamente una vez** por ejecución certificada.  
4. **Sin retroceso silencioso:** no hay transiciones hacia atrás salvo un **flujo explícito de incidencias**.  
5. **Determinismo:** cada evidencia es determinista y repetible (mismo input → misma secuencia).  
6. **Trazabilidad:** `tenant_id`, `order_id` (y refs de lote/ruta cuando existan) se conservan en cada handoff.  
7. **Sin bridge manual:** Excel/chat/reconstrucción humana para completar el handoff = Flow Gap (FAIL).  
8. **Consumo, no invención:** Delivery no crea pedidos; solo consume Outcomes de Packaging/Kitchen.  
9. **Packaging lifecycle:** `PackagingBatch` solo avanza `CREATED → IN_PROGRESS → READY → CLOSED` (sin saltos).  
10. **T4 terminal:** `FLOW01_T4_COMPLETED` ⇒ `orders.status = delivered`.

---

## Errores / desviaciones permitidas (no implementar ahora)

Situaciones que **pueden** existir en el dominio, clasificadas para no confundir el happy path con excepciones futuras.

| Etapa | Desviación | ¿Parte del happy path FLOW-01? | Tratamiento |
|-------|------------|--------------------------------|-------------|
| T1 | Cancelar pedido / producción | No | Excepción futura · `cancelled` · no emite COMPLETED de T1–T4 |
| T2 | Pausar producción | No | Excepción futura · no rompe invariantes si no avanza evidencia |
| T3 | Reempaquetar tras `READY`/`CLOSED` | No | Flujo de incidencia explícito · **no** retroceso silencioso |
| T4 | Devolver / `delivery_issue` | No | Incidencia Delivery · **no** cuenta como `FLOW01_T4_COMPLETED` |
| T4 | Reintento tras incidencia | No | Fuera del runner happy-path; Spec de incidencias aparte |

**Regla:** el runner canónico FLOW-01 certifica el **happy path**.  
Las filas de esta tabla **no** se implementan en el primer PR de producto; quedan nombradas para evitar ambigüedad (“¿cancelar es T1?” → no en el PASS canónico).

---

## Freeze previo a implementación

### 1. Entidades (contrato Spec)

| Entidad Spec | Rol en el flujo | As-built EatClean (hoy) | Estado freeze |
|--------------|-----------------|-------------------------|---------------|
| **Order** | Unidad de trabajo T1–T4 | `orders` + `order_items` · spine operacional | ✅ congelada |
| **ProductionBatch** | Lote de cocina | `kitchen_production_batches` | 🟡 alinear nombre/status en impl |
| **PackagingBatch** | Lote de empaquetado | — (UI/mock) | ✅ **ciclo congelado** (tabla TBD en impl) |
| **DeliveryRoute** | Ruta de reparto | `routes` (+ `route_stops`) | ✅ congelada |
| **DeliveryAssignment** | Asignación pedido→ruta | `route_stops` + `driver_id` | 🟡 suficiente como composición en v1 |

**Spine Order (happy path FLOW-01):**  
`confirmed → in_production → prepared → ready_for_delivery → out_for_delivery → delivered`

### 2. RPCs / servicios (contrato Spec)

| Operación Spec | Intención | As-built más cercano | Estado freeze |
|----------------|-----------|----------------------|---------------|
| `startProduction` | Abrir producción | `transitionBatch` / `transitionKitchen` | 🟡 envolver |
| `completeProduction` | Cerrar producción | idem + `transition_order_status` | 🟡 |
| `startPackaging` | Abrir `PackagingBatch` | — | ✅ nombre congelado · impl crea entidad |
| `completePackaging` | Cerrar batch → handoff | — | ✅ nombre congelado |
| `assignDelivery` | Asignar a ruta/parada | `RouteService.addStop` / `setDriver` | 🟡 |
| `completeDelivery` | Confirmar entrega cliente | `recordAttempt` + `transition_order_status` → `delivered` | ✅ semántica congelada |

### 3. Contrato de evidencias (congelado)

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

Reglas:

- Cada paso **exactamente una vez**, en ese orden  
- `STOP` + `reason` si falla precondición/invariante  
- Evidencia JSON comparable (estilo `ps002c-canonical-auth.json`)  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`  
- Los nombres **no** cambian por refactors de UI/función  

Opcional de envoltura: `FLOW01_START` / `FLOW01_END` en el runner.

---

## Runner canónico (objetivo post-Spec)

Equivalente filosófico a `test:ps002-canonical-auth` / FCR-008:

```text
FLOW01
FLOW01_T1_STARTED
    ↓
FLOW01_T1_COMPLETED
    ↓
FLOW01_T2_STARTED
    ↓
FLOW01_T2_COMPLETED
    ↓
FLOW01_T3_STARTED
    ↓
FLOW01_T3_COMPLETED
    ↓
FLOW01_T4_STARTED
    ↓
FLOW01_T4_COMPLETED
    ↓
PASS
```

Comprobaciones obligatorias (igual que Auth):

| Check | Criterio |
|-------|----------|
| Duplicados | `duplicates=[]` |
| Ausentes | `missing=[]` |
| Fuera de orden | `out_of_order=[]` |
| Estado terminal | order = `delivered` · PackagingBatch = `CLOSED` (si existe) |
| Tiempos | `duration_ms` diagnóstico (no PASS/FAIL) |
| Artefacto | JSON de evidencia versionable en `docs/10-validation/` |

Comando previsto (nombre congelable): `npm run test:flow01-canonical`  
**No se implementa en este PR** — solo tras merge de Spec freeze.

Los **invariantes** de este documento deben aparecer como assertions del runner (no solo como prosa).

---

## Criterios FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| Delivery no ve pedidos empaquetados | Flow Gap |
| Cantidades / refs rotas en el traspaso | Invariante de trazabilidad |
| Pedido en Packaging sin T1/T2 COMPLETED | Violación de orden de etapas |
| `FLOW01_T4_COMPLETED` con status ≠ `delivered` | Violación criterio T4 |
| Packaging salta `IN_PROGRESS` → `CLOSED` sin `READY` | Violación lifecycle |
| Requiere chat/Excel/manual bridge | Handoff no operacional |
| Solo UI “parece bien” sin evidencia | No Done de Flow |
| Doble emisión de un token `FLOW01_*` | Violación de evidencia única |
| `delivery_issue` contado como PASS | Confundir incidencia con happy path |

---

## Fuera de Spec (explícito)

- Reabrir Auth / PS-002-C / **FCR-008** salvo **regresión** demostrada  
- Event Bus · Notifications · Jobs · Analytics · AI · Facturación  
- Flujos de incidencia (cancelar / pausar / reempaquetar / devolver) — solo nombrados  
- Certificar pantallas como PASS de Flow  
- Implementación de producto / runner en este PR  

---

## Plan de trabajo (hoja de ruta)

| # | Paso | Estado |
|---|------|--------|
| 1 | Merge PR #140 (acta PS-002-C) | ✅ MERGED |
| 2 | Tag `ps002c-pass` → `545bd19` | ✅ |
| 3 | `CURRENT_PHASE` = Stabilization COMPLETE (Flow-ready) | ✅ |
| 4 | Plantilla T1–T4 + invariantes + evidencias | ✅ |
| 5 | Cerrar GAP Packaging lifecycle | ✅ este commit |
| 6 | Cerrar GAP criterio T4 (`delivered`) | ✅ este commit |
| 7 | Errores/desviaciones permitidas (nombradas) | ✅ este commit |
| 8 | Aprobar / merge Spec (PR #141) = **SPEC FROZEN** | ✅ MERGED |
| 9 | Runner `test:flow01-canonical` (Evidence before Implementation) | ▶ #142 |
| 10 | Implementación incremental FLOW01-001…004 | ⏳ [DELIVERY_PLAN](./FLOW_01_DELIVERY_PLAN.md) |

---

## Definition of Done (este documento)

| Criterio | Estado |
|----------|--------|
| Handoff Kitchen→Delivery nombrado | ✅ |
| Cadena Kitchen→…→Delivery descrita | ✅ |
| Plantilla uniforme T1–T4 | ✅ |
| Invariantes del flujo | ✅ |
| PackagingBatch lifecycle congelado | ✅ |
| Criterio T4 = `delivered` congelado | ✅ |
| Errores/desviaciones permitidas nombradas | ✅ |
| Contrato evidencias `FLOW01_T*` | ✅ |
| Contrato runner canónico (spec) | ✅ |
| Implementación producto / runner código | ❌ no en este PR |
| Certificación FLOW-01 | ⏳ tras merge Spec + impl + evidencia |

**Tras aprobar este PR:** Spec = FROZEN · siguiente trabajo = runner canónico + implementación del happy path alineada a los contratos.
