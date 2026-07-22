# VS-003 — Escenario Hostil · Incidente de seguridad alimentaria

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-003](../05-validation-reports/VR-003-seguridad-alimentaria-retiro.md)  
**Clasificación:** **Extended** · severidad 🔁  
**Dimensión:** **Trazabilidad / seguridad alimentaria** (recorrido **inverso**)  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)

---

## Objetivo

Intentar romper el modelo cuando un **ingrediente ya utilizado** en producción debe retirarse por problema sanitario.

> No cambia un pedido.  
> No replanifica por voluntad del negocio.  
> Cambia la **confianza** sobre algo que **ya ocurrió**.

No resolver la crisis. Preguntar: **¿el modelo entiende una crisis?**

---

## Contexto

| | |
|--|--|
| **Organization** | EatClean Tenerife |
| **Momento** | Viernes **12:18** |
| **Estado** | Producción y Packaging terminados · Norte entregando · Sur en reparto · Facturación pendiente |

### Evento

Proveedor: lote de **pollo** de esa mañana — posible contaminación microbiológica · **retirada inmediata**.

| Impacto conocido | Cantidad |
|------------------|----------|
| Production Batches | 3 |
| Orders | 74 |
| Consumers | 61 |
| Company Accounts | 2 |
| Estados físicos | Entregado · En reparto · En cámara |

---

## Por qué tensiona otra dimensión

```text
Hasta ahora (VS-001 · VS-002):
Menu → Order → Plan → Batch → Packaging → Route → Delivery → Payment

Ahora (VS-003):
Ingredient / lote  →  Batch  →  Order  →  Consumer / Beneficiary
                   (hacia atrás)
```

Si el modelo solo narra hacia adelante, aquí aparece la grieta.

---

## Auditoría — 7 pasos × 6 preguntas

### Paso 1 — Identificar Production Batches afectados

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Ingredient · Production Batch · Recipe | ✔ parcial |
| Dependency | Recipe `requires` Ingredient · Batch `consumes` Stock · Batch `uses` Recipe | ✔ |
| Transición | N/A (consulta de trazabilidad) | — |
| Check | ¿**Qué Batches consumieron** este input? | ⚠ |
| Invariant | INV-033 | ✔ |
| ¿Concepto nuevo? | **Lote de proveedor (lot)** no es Core ni Supporting explícito. Stock no exige identidad de lote | **Sí** (Supporting/atributo) |

**Notas:** Se llega a Batches por Ingredient vía Recipe **si** el consumo quedó registrado. **No** se parte de un «lote proveedor» canónico: el modelo habla Ingredient/Stock, no lot ID. **Grieta de entrada inversa.**

---

### Paso 2 — De Batch a Orders

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Batch · Production Plan · Order · Order Item · Dish | ✔ |
| Dependency | Plan `fulfills` Orders · Batch `executes as` desde Plan · INV-031 «referencia necesidad» | ⚠ |
| Transición | — | — |
| Check | ¿**Qué Orders cubre** este Batch? | ⚠ |
| Invariant | INV-031 — granularidad «Plan / Orders / Dish **según Tenant**» | ⚠ ambigua |
| ¿Concepto nuevo? | No — falta **obligatoriedad** de traza Batch → Order Item / Packaging | No (objeto) / Sí (precisión) |

**Notas:** Camino narrable Batch → Plan → Orders **si** el Plan conserva agregación. Si Batch solo referencia Dish, los 74 Orders no se recuperan con certeza. Packaging → Order Item es el puente más fiable — debe ser obligatorio en retirada.

---

### Paso 3 — De Orders a Consumers / Beneficiaries

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Order · Consumer · Beneficiary · Company Account | ✔ |
| Dependency | Actor `places` Order · Company `contracts for` Beneficiary · INV-004 · INV-015 | ✔ |
| Transición | — | — |
| Check | — | — |
| Invariant | INV-004 · INV-014 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** **Confirmed** — una vez identificados los Orders, los destinatarios existen.

---

### Paso 4 — Detener Deliveries no finalizadas

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Delivery · Delivery Route · Packaging | ✔ |
| Dependency | Route `performs` Delivery · Delivery `confirms` | ✔ |
| Transición | `Attempted` → `Failed` \| `Incident` documentado · falta «Quarantine / Stop» en Pending/In route | ⚠ |
| Check | ¿**Puede detenerse** esta Delivery / Route por seguridad? | ✗ explícito |
| Invariant | INV-041 · INV-022 | ✔ |
| ¿Concepto nuevo? | No Core — evento/Check de seguridad sobre Delivery/Route | No |

**Notas:** Incident cubre parte. Falta Check canónico de **parada sanitaria** mid-route. Extended menor (Lifecycle/Check), no objeto nuevo.

---

### Paso 5 — Packaging en cámara

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Label · Batch | ✔ |
| Dependency | Batch `produces` Packaging · Label `identifies` | ✔ |
| Transición | Complete / Handed — **no** hay Quarantine / Void sanitario explícito (Label Void existe) | ⚠ |
| Check | ¿**Puede bloquearse** Packaging almacenado? | ✗ |
| Invariant | INV-030 · INV-035 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Extended — transición Quarantine/Void en Packaging (o Label Void + Packaging fuera de Route).

---

### Paso 6 — Representar la retirada

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Ninguno llamado Recall / Retirada | — |
| Dependency | — | — |
| Transición | No hay Lifecycle «Food Safety Recall» | ✗ |
| Check | — | — |
| Invariant | Ninguno prohíbe la retirada; ninguno la nombra | — |
| ¿Concepto nuevo? | **Recall como Core: No** (falla filtro espina). Opciones: evento/Supporting **FoodSafetyIncident** · o Capability que orquesta Batch/Packaging/Delivery | Ver dictamen |

**Dictamen local (principio 13):**

1. Explicar con Incident Delivery + Quarantine Packaging + traza lote → Batch → Order — **sin** Core Recall.  
2. Si hace falta entidad de caso: Supporting **FoodSafetyIncident** (o Incident operativo) que **referencia** lot/Batches/Orders — no eslabón de espina.  
3. Inventar Core `Recall` = sobre-modelado.

---

### Paso 7 — Payment

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Payment · Order · Invoice (Supporting) | ✔ |
| Dependency | Payment `settles` Order | ✔ |
| Transición | Settled / Due / Failed — **no** Credit / Refund explícito | ⚠ |
| Check | ¿**Puede anularse / acreditarse** el cobro tras retirada? | ✗ |
| Invariant | INV-040 — liquida Order; no impide crédito si se documenta | ✔ no roto |
| ¿Concepto nuevo? | No — ampliar Lifecycle Payment (Credit/Refund) o Invoice | No |

**Notas:** Modelo distingue Payment ≠ Order. No modela aún devolución. **Extended** Lifecycle, no Contradicted INV-040.

---

## Resumen

| Pregunta de la dimensión | Respuesta corta |
|--------------------------|-----------------|
| ¿Trazabilidad suficiente? | **Parcial** — falta identidad de **lote** y traza Batch→Order obligatoria |
| ¿Recorrido hacia atrás? | **Roto en la entrada** (lote) · débil Batch→Orders · fuerte Orders→actores |
| ¿Invariant impide retirada? | **No** |
| ¿Nuevo Core Object? | **No** (Lot/Incident Supporting; Recall≠Core) |
| ¿Basta ampliar Lifecycle? | **Sí** + precisión INV-031 / Stock lot |

| ID | Hallazgo | Local |
|----|----------|-------|
| H1 | Lote proveedor no canónico | Extended |
| H2 | Batch→Orders no garantizado (INV-031 laxo) | Extended / Clarified |
| H3 | Orders→actores | Confirmed |
| H4 | Stop Delivery sanitario | Extended menor |
| H5 | Packaging quarantine | Extended menor |
| H6 | Retirada sin Core Recall | Clarified (Supporting/evento) |
| H7 | Refund/Credit Payment | Extended |

---

## Dictamen → VR-003

**Extended** — el modelo no entiende del todo una crisis de seguridad porque **no soporta bien el recorrido inverso desde lote**; no porque un Invariant lo prohíba ni porque falte un Core de espina.

Ver [VR-003](../05-validation-reports/VR-003-seguridad-alimentaria-retiro.md) · [MC-003](../06-model-changes/MC-003-lot-traceability-recall.md) ⏸.
