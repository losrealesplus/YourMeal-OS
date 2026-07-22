# VS-004 — Escenario Hostil · Error humano y recuperación

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-004](../05-validation-reports/VR-004-error-humano-etiquetas.md)  
**Clasificación:** **Extended** · severidad 🔁  
**Dimensión:** **Error humano y recuperación** (mundo físico ≠ registro digital)  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)

---

## Objetivo

Intentar romper el modelo cuando un error humano genera inconsistencia entre **realidad física** y **realidad registrada**.

> No: «¿Cómo evitamos el error?»  
> Sí: **«¿Puede el modelo recuperarse sin perder coherencia?»**

---

## Contexto

| | |
|--|--|
| **Organization** | EatClean Tenerife |
| **Momento** | Martes **10:52** |
| **Estado** | Batches finalizados · Packaging **In progress** · Routes generadas · Deliveries Pending · **nada entregado** |

### Evento

Operario Packaging:

- 12 etiquetas **Sin Gluten** sobre envases **normales**  
- 12 etiquetas **normales** sobre comidas **Sin Gluten**  

Visualmente «correcto». Detectado por otro empleado **antes** de cargar la ruta.

### Lo que el sistema sabe (digital)

Packaging ↔ Batch ↔ Order ↔ Consumer/Beneficiary — **vínculos correctos**.

### Lo que falló (físico)

Contenido físico ↔ pegatina impresa — **ya no coinciden**.

---

## Dimensión (≠ VS-001…003)

| VS | Dimensión |
|----|-----------|
| 001 | Adaptabilidad |
| 002 | Continuidad |
| 003 | Trazabilidad inversa |
| **004** | **Recuperación ante inconsistencia físico/digital** |

---

## Auditoría — 8 pasos × 6 preguntas

### Paso 1 — Detección

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Production Batch · Order · Consumer/Beneficiary | ✔ |
| Supporting | **Label** · Employee | ✔ |
| Dependency | Label `identifies` Packaging · Batch `produces` Packaging · Order `references` Dish | ✔ |
| Transición | — (detección humana) | — |
| Check | Ninguno disparó aún — el error es post-Applied visual | ⚠ |
| Invariant | INV-035 asume Label identifica; no verifica pegatina vs contenido | ⚠ |
| ¿Concepto nuevo? | No | No |

**Notas:** No falta Core. Falta que la detección pueda **abrirse** como evento sobre Packaging/Label.

---

### Paso 2 — Descubrimiento (discrepancia)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Batch (contenido vía Recipe/Dish) | ✔ |
| Supporting | Label (metadatos: alérgeno · destinatario) | ✔ |
| Dependency | Label `identifies` Packaging — **asume verdad** | ⚠ |
| Transición | No hay estado «Discrepancy / Mismatch» | ✗ |
| Check | ¿**Coincide** Label con contenido del Batch/Order Item? — no canónico post-Applied | ✗ |
| Invariant | INV-035 · INV-002 | ✔ (no contradichos) |
| ¿Concepto nuevo? | **No Conformidad como Core: No.** Evento/Check o Supporting Incident | No |

**Notas:** El modelo **distingue** Packaging (unidad) y Label (identidad), pero no modela **desacuerdo** entre ellos una vez Applied.

---

### Paso 3 — Bloqueo

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Delivery Route | ✔ |
| Dependency | Packaging `assigns to` Route (aún no Handed) | ✔ |
| Transición | Estados Packaging: `Pending` · `In progress` · `Complete` · `Handed to route`. **No** Held / Under review / Quarantine | ✗ |
| Check | ¿**Puede retenerse** Packaging? | ✗ |
| Invariant | INV-020 (retroceso necesita evento) · INV-052 | ✔ |
| ¿Concepto nuevo? | No — faltan **estados/transiciones** | No |

**Notas:** Label `Void` existe. Packaging no tiene Retenido/Liberado. Completar sin Held deja solo «no hacer Hand to route» por disciplina — insuficiente como Lifecycle.

---

### Paso 4 — Operational Checks (impedir salida)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Label · Route · Order | ✔ |
| Dependency | Hand to route / Ready Route | ✔ |
| Transición | Hand to Route · Ready Route | ✔ existen |
| Check | Complete: Label · alergias · destinatario — **antes** de Applied correcto. Post-swap: ¿**Puede entregarse a Route** con identidad verificada? **no explícito** | ⚠ |
| Invariant | INV-035 · INV-052 · INV-054 | ✔ |
| ¿Concepto nuevo? | No | No |

**Checks deseados (hoy implícitos o ausentes post-error):**

| Pregunta | ¿Existe? |
|----------|----------|
| ¿Etiquetas coinciden con contenido/Order? | ✗ post-Applied |
| ¿Alérgenos correctos? | Parcial en Complete |
| ¿Packaging ↔ Order correcto? | Vínculo digital sí; verificación física no |

---

### Paso 5 — Corrección (reetiquetado)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging (mismo) · **no** Batch · **no** Order | ✔ |
| Supporting | Label: `Void` → nuevo `Printed` → `Applied` | ✔ |
| Dependency | Label `identifies` Packaging | ✔ |
| Transición | Corrección = **solo Label** (+ Packaging Held→Complete si se añade Held) | ✔ intención |
| Check | ¿**Puede reetiquetarse**? ¿**Puede liberarse**? | ⚠ |
| Invariant | INV-020 · Batch/Order inmutables en este error | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** **Confirmed** el alcance: no tocar Batch ni Order. Label Void ya prevé anulación. Falta amarrar Packaging a un ciclo Hold → Relabel → Release.

---

### Paso 6 — Logística

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Delivery Route · Packaging · Delivery | ✔ |
| Dependency | Route `transports` Packaging | ✔ |
| Transición | Routes **no salieron** — no hace falta regenerar si mismos Packaging liberados | ✔ |
| Check | ¿**Puede partir** la Route? tras Release | ✔ (Ready) |
| Invariant | INV-042 · INV-053 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** **Confirmed** — continúa; no Revise Route obligatorio.

---

### Paso 7 — Evidencia / «Incidente»

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | — | — |
| Supporting | Label Void deja huella · Delivery.Incident es otro contexto | ⚠ |
| Dependency | — | — |
| Transición | No hay Incident de Packaging/Label | ⚠ |
| Check | — | — |
| Invariant | INV-044 · INV-003 | ✔ |
| ¿Concepto nuevo? | **Incident/NoConformidad como Core: No.** Capability auditoría **o** Supporting OperationalIncident | No |

**Dictamen (pregunta incómoda):**

1. Huella mínima: Labels Void + evento explícito Hold/Release (Lifecycle) + quién/ cuándo.  
2. Capability de auditoría puede **consumir** esos eventos sin objeto de espina.  
3. Si Observation exige caso de no conformidad: Supporting — **nunca** Core.

---

### Paso 8 — Cierre

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging Complete · Labels Applied correctas | ✔ |
| Dependency | Listo para `assigns to` Route | ✔ |
| Transición | Vuelta operativa a «listo» **con historial** Void/Hold | ✔ |
| Check | Hand to Route OK | ✔ |
| Invariant | INV-020 — no borrón y cuenta nueva sin evento | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** El modelo **no** debe volver al mismo estado histórico. Debe quedar **huella**. Eso es coherente con INV-020. **Confirmed** como principio; **Extended** en mecánicas que aún faltan para dejar esa huella en Packaging.

---

## Resumen

| Pregunta de la dimensión | Respuesta |
|--------------------------|-----------|
| ¿Lifecycle Packaging más rico? | **Sí** — falta Hold / Under review / Release |
| ¿Retener / Liberar? | **No** explícito hoy |
| ¿Contenido vs metadatos? | Objetos distintos (Batch/Dish vs Label) · **sin** estado de desacuerdo |
| ¿No Conformidad Core? | **No** — Check + Label Void + Supporting/Capability |
| ¿Invariant bloquea entrega sin identidad verificada? | INV-035 parcial · **no** cubre swap post-Applied |

| ID | Hallazgo | Local |
|----|----------|-------|
| H1 | Objetos de detección suficientes (+ Label) | Confirmed |
| H2 | Sin representación de discrepancia Label↔contenido | Extended |
| H3 | Sin Held/Release en Packaging | Extended |
| H4 | Checks Hand-to-Route incompletos post-error | Extended |
| H5 | Corrección = Label (+ Packaging hold), no Batch/Order | Confirmed |
| H6 | Route no regenera | Confirmed |
| H7 | Incident Core rechazado · evidencia vía eventos | Clarified |
| H8 | Huella operativa necesaria (INV-020) | Confirmed principio |

---

## Dictamen → VR-004

**Extended** — el modelo puede narrar la **recuperación** (Void Label · no tocar Batch/Order · Route sigue) pero **no aislar** Packaging en error ni verificar identidad post-Applied antes de salir.

Ver [VR-004](../05-validation-reports/VR-004-error-humano-etiquetas.md) · [MC-004](../06-model-changes/MC-004-packaging-hold-relabel.md) ⏸.
