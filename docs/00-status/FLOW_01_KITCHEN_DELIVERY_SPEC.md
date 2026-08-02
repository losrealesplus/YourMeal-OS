# FLOW-01 · Kitchen → Delivery · Specification

**Documento:** `FLOW_01_KITCHEN_DELIVERY_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **SPEC IN PROGRESS** — sin implementación en este PR  
**Precondición de plataforma:** PS-002-C ✅ PASS · [PS002C_PASS_ACTA](../10-validation/platform-stabilization/PS002C_PASS_ACTA.md) · tag `ps002c-pass`  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [FLOW_FIRST](./FLOW_FIRST.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md)  
**Framing:** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)

> Objetivo: definir el handoff operativo **antes de código**, con la misma disciplina que FCR-008:  
> estados · precondiciones · transiciones · invariantes · evidencia automatizable · criterios de salida.

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
   ↓  (production ready)
Production
   ↓  (batch / lot ready)
Packaging
   ↓  (packed / dispatchable)
Delivery
```

| Etapa | Workspace / Journey (ref.) | Rol típico |
|-------|----------------------------|------------|
| Kitchen | Kitchen Journey (EP-OPS-003) | `kitchen` / production |
| Production | Kitchen / Ops (según modelo actual) | production / kitchen |
| Packaging | (a fijar en Spec — puede ser etapa de Kitchen o Logistics) | kitchen / logistics |
| Delivery | Delivery Journey (EP-OPS-003) | `delivery` / logistics |

**Fuera de FLOW-01 (por ahora):** Customer order intake · Support · Accounting · SaaS admin.

**En paralelo (no bloquea Spec):** BR-03.3 Runtime Validation (Admin create dish → week → publish → client).

---

## Cadena de certificación (igual filosofía que FCR-008)

```text
Handoff definido
    ↓
Evidence reproducible (automatizada preferida)
    ↓
Flow certificado
    ↓
Merge
```

Cada transición Tₙ debe poder emitir evidencia observable (log estructurado, assertion de estado, o test de contrato), no solo “probado a mano”.

---

## Plantilla FOPEBA por transición

Para **cada** flecha del flujo, completar la tabla (rellenar en iteraciones de Spec; vacío = NOT DEFINED).

### T1 · Kitchen → Production

| Campo | Definición |
|-------|------------|
| **Estado de entrada** | Pedidos / slots de menú listos para producir (definir entidad + status) |
| **Precondiciones** | Tenant activo · rol kitchen/production · menú publicado / pedidos confirmados (fijar) |
| **Transición** | Evento/acción que marca “en producción” / lote abierto |
| **Invariantes** | No pérdida de `order_id` / `slot` / tenant_id · cantidades conservadas |
| **Evidencia** | Comando / test / log canónico (nombre TBD, estilo `[FLOW-01] T1_*`) |
| **Criterio de salida** | Production puede listar el trabajo sin reconstrucción manual |

### T2 · Production → Packaging

| Campo | Definición |
|-------|------------|
| **Estado de entrada** | Lote / ítems producidos |
| **Precondiciones** | T1 cumplida |
| **Transición** | Marca “listo para empaquetar” / packaging queue |
| **Invariantes** | Trazabilidad lote → pedidos · sin doble conteo |
| **Evidencia** | TBD |
| **Criterio de salida** | Packaging ve cola completa y correcta |

### T3 · Packaging → Delivery

| Campo | Definición |
|-------|------------|
| **Estado de entrada** | Pedidos empaquetados / rutas asignables |
| **Precondiciones** | T2 cumplida · datos de entrega presentes |
| **Transición** | Handoff a Delivery (dispatch / route / “ready for delivery”) |
| **Invariantes** | Dirección / ventana / tenant / order refs intactos |
| **Evidencia** | TBD — **handoff primario del catálogo** Kitchen→Delivery |
| **Criterio de salida** | Delivery Journey puede operar sin preguntar a Kitchen |

### T4 · Delivery (consumo Outcome)

| Campo | Definición |
|-------|------------|
| **Estado de entrada** | Cola Delivery alimentada por T3 |
| **Precondiciones** | Rol delivery · rutas/órdenes visibles |
| **Transición** | (opcional en FLOW-01) inicio de ruta / mark out-for-delivery |
| **Invariantes** | Solo consume Outcomes de Packaging/Kitchen; no inventa pedidos |
| **Evidencia** | TBD |
| **Criterio de salida** | Outcome Delivery alineado a Journey ya CERTIFIED |

---

## Contrato de evidencia (borrador — estilo FCR-008)

Propuesta de hitos once-only (nombres provisionales; congelar antes de implementación):

```text
FLOW01_START
KITCHEN_READY
PRODUCTION_STARTED
PRODUCTION_COMPLETE
PACKAGING_READY
PACKAGING_COMPLETE
DELIVERY_RECEIVED
HANDOFF_OK
FLOW01_END
```

Reglas:

- Cada paso **exactamente una vez**, en orden  
- `STOP` + `reason` si falla una precondición/invariante  
- Evidencia JSON comparable (como `ps002c-canonical-auth.json`)  
- PASS solo si `missing=[]` · `duplicates=[]` · `out_of_order=[]`

---

## Criterios FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| Delivery no ve pedidos empaquetados | Flow Gap (no Surface Gap de Kitchen) |
| Cantidades / refs rotas en el traspaso | Invariante de trazabilidad |
| Requiere chat/Excel/manual bridge | Handoff no operacional |
| Solo UI “parece bien” sin evidencia | No Done de Flow |

---

## Fuera de Spec (explícito)

- Reabrir Auth / PS-002-C / FCR-008 salvo regresión  
- Event Bus · Notifications · Jobs · Analytics · AI  
- Certificar pantallas como PASS de Flow  

---

## Plan de trabajo Spec (sin código de producto)

1. Congelar entidades y status codes reales del repo (orders / kitchen tickets / delivery)  
2. Completar tablas T1–T4 con campos concretos del dominio YM OS  
3. Fijar nombres del contrato de evidencia  
4. Definir comando de smoke (p. ej. `npm run test:flow01-canonical`) — **después** de Spec  
5. Solo entonces Implementation PRs  

---

## Definition of Done (este documento)

| Criterio | Estado |
|----------|--------|
| Handoff Kitchen→Delivery nombrado | ✅ |
| Cadena Kitchen→…→Delivery descrita | ✅ |
| Plantilla FOPEBA por transición | ✅ (pendiente relleno de dominio) |
| Contrato evidencia borrador | ✅ |
| Implementación producto | ❌ no en este PR |
| Certificación FLOW-01 | ⏳ tras Spec + Evidence |

Siguiente PR de Spec: mapear T1–T4 a tablas/RPCs/status reales del código EatClean.
