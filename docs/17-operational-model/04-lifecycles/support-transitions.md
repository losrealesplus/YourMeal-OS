# Transiciones de soporte

Supporting objects — transiciones más simples.  
No sustituyen la espina.  
Clases Dynamics: [Lifecycles 2.0](../07-operational-dynamics/01-operational-lifecycles-2.0.md) · familias: [Supporting Taxonomy](../07-operational-dynamics/02-supporting-objects-taxonomy.md).

---

## Label (Supporting · Traceability)

`Pending` → `Printed` → `Applied` → `Void`

| Transición | Clase | Check en transición |
|------------|-------|---------------------|
| → `Applied` | Happy | ¿**Puede aplicarse** la etiqueta? (destinatario · alergias · fecha) → PASS / BLOCKED / MANUAL |
| `Applied` → `Void` | Exceptional | ¿**Puede anularse**? (error · reprint · mismatch VS-004) → PASS / MANUAL |
| Void / Printed → `Applied` (reapply) | Recovery | ¿**Puede reaplicarse** identidad correcta? · Packaging Held o en espera → PASS / BLOCKED / MANUAL |

Vinculado a Packaging **Complete**.  
Corrección de identidad = Void + nuevo ciclo · **sin** cambiar Batch ni Order (MC-004).  
Tras mismatch: Packaging puede **Hold** → Recovery Pattern → Release.

---

## Stock (Supporting · Resource + traza)

No es una línea única. Eventos que mueven posición:

| Evento | Efecto |
|--------|--------|
| Receive (compra) | Aumenta Available · **Lot** opcional→requerido por Product/Check (MC-003) |
| Reserve (opcional) | Available → Reserved |
| Consume (Batch) | Reduce Available · Batch `consumes` Stock **con Lot** si aplica |
| Adjust | Corrección auditada |

| Check en transición | Pregunta | Resultados 2.0 |
|---------------------|----------|----------------|
| Antes de Receive | ¿**Puede recibirse** Stock? (Ingredient · Kitchen · Lot si requerido) | PASS / BLOCKED / MANUAL |
| Antes de consumir | ¿**Puede consumirse** este Stock (Lot) para el Batch? | PASS / BLOCKED / MANUAL |
| Antes de reservar | ¿**Puede reservarse** para el Plan? | PASS / WARNING / BLOCKED |

---

## Lot (Supporting · Traceability) *(MC-003 · VR-003)*

Identidad de lote proveedor — **no** Core de espina.

| Evento | Efecto |
|--------|--------|
| Receive with Lot | Lot Received ligado a Ingredient + Supplier (+ Stock) |
| Consume in Batch | Lot referenciado desde Batch `consumes` |
| Quarantine Lot *(opcional)* | Bloquea nuevos Consume · Packaging ligado puede Hold |

| Check | Pregunta |
|-------|----------|
| Receive | ¿**Lot** obligatorio para este Ingredient/Product? |
| Start/Consume Batch | ¿**Puede consumirse** este Lot? (vigencia · quarantine) |
| Recall path | ¿Puede listarse Batch → Packaging → Order Item → destinatario desde Lot? (INV-031) |

Recall / FoodSafetyIncident = Supporting u órbita de eventos — **nunca** Core.

---

## Location (Supporting · Spatial) *(MC-006 · VR-006)*

`Draft` → `Active` → `Inactive`

| Transición | Check |
|------------|-------|
| → Active | ¿**Puede activarse** este destino / almacén / sede? |
| Delivery Confirm / Update destination | ¿**Location** válida para el destinatario / servicio? → PASS / BLOCKED / MANUAL |

Relaciona: Delivery · Beneficiary · Kitchen · Stock (almacén).  
**No** Core «Ward» / «Classroom» / «EmergencyOrder».

---

## Dish / Recipe / Ingredient (catálogo)

Transiciones de catálogo (Domain Module 01):

`Draft` → `Active` → `Inactive` → `Archived`

Checks en transición típicos:

- ¿**Puede activarse** este Dish para Weekly Menu?
- ¿**Puede archivarse** sin romper Orders históricos?

---

## Order Item (Supporting)

No tiene máquina independiente de la del Order padre.

Transiciones relevantes:

- Parte de Order **Confirm** / **Cancel**
- Parte de **Amend Confirmed Order** (líneas · dieta del servicio · cantidad) — MC-001

Alergias / perfil base → Beneficiary (config).  
Dieta del servicio → Order Item (+ Amend) — MC-006.

---

## Invoice (Supporting · Administrative)

`Draft` → `Issued` → `Paid` → `Void`

Check: ¿**Puede emitirse** factura? (después de reglas contables de la Organization).

Payment **settles** Order; Invoice documenta.  
Crédito / ajuste post-recall vía Invoice Supporting sin romper INV-040 (MC-003).
