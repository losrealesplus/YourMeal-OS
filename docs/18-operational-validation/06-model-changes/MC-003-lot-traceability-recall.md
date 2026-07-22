# MC-003 — Lote · traza inversa · retirada (aparcado)

**Validation Report:** [VR-003](../05-validation-reports/VR-003-seguridad-alimentaria-retiro.md)  
**Fecha:** 2026-07-22  
**Estado:** ⏸ **aparcado** — no aplicar hasta análisis conjunto post VS-006 (principio 16)

---

## Problema demostrado

Retirada sanitaria: el modelo no garantiza  
`lote proveedor → Batches → Orders → destinatarios`  
ni nombra quarantine/retirada/crédito sin forzar un Core ilegítimo.

---

## Cambio propuesto (borrador — priorizar en bloque con MC-001·002)

### 1. Identidad de lote (no Core)

- Supporting **Lot** (o atributo obligatorio en Stock **Receive**) ligado a Ingredient + Supplier.  
- Batch `consumes` Stock **con referencia de Lot**.

### 2. Traza Batch → demanda

- Endurecer INV-031: todo Batch debe poder listar Order Items / Packaging cubiertos (no solo Dish genérico).  
- Puente canónico: Packaging / Label → Order Item → Order.

### 3. Lifecycle seguridad (sin Core Recall)

- Packaging: `Quarantine` / Void sanitario.  
- Delivery/Route: Check ¿**Puede detenerse** por seguridad? → Incident/Failed.  
- Supporting opcional **FoodSafetyIncident** que referencia Lots · Batches · Orders (órbita, no espina).

### 4. Payment

- Transición Credit/Refund o ajuste vía Invoice Supporting sin romper INV-040.

### 5. Explicitar rechazos

| Concepto | Decisión |
|----------|----------|
| Recall como Core | Rechazado |
| Lot como Core de espina | Rechazado |

---

## Nota de priorización

Puede solaparse con necesidades de VS-006 (reglas distintas).  
**No fusionar ni aplicar** hasta ver VR-004…006.

**Estado:** ⏸ aparcado
