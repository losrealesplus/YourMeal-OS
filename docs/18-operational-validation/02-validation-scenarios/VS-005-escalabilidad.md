# VS-005 — Escenario Hostil · Escalabilidad operacional

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-005](../05-validation-reports/VR-005-escalabilidad-eatclean.md)  
**Clasificación:** **Clarified** · severidad ⚠  
**Dimensión:** **Escalabilidad** (¿el modelo describe el dominio o solo EatClean pequeño?)  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)

---

## Objetivo

Someter el modelo a un crecimiento **repentino y extraordinario** **sin** nuevos tipos de proceso.

> ¿El modelo sigue siendo el **mismo** cuando la escala deja de ser «normal»?

No diseñar la solución.  
No confundir escalar **implementación** con escalar **modelo**.

---

## Criterio específico de éxito (además del general)

> El incremento de escala **no** debe obligar a **redefinir el dominio**.  
> Si aparecen conceptos nuevos, deben ser capacidad operacional **genuinamente nueva**, no consecuencia del volumen.

---

## Contexto

| | Habitual | Tras contrato |
|--|----------|---------------|
| Organization | EatClean Tenerife | igual |
| Orders / semana | ~180 | ~**1.030** |
| Comidas | ~420 | **>2.400** |
| Production Batches | ~12 | se multiplican |
| Routes | 2 | → **8** |
| Kitchen | 1 | **2** (+ 2º turno) |
| Vehicle | (implícito) | **+1** segundo vehículo |
| Beneficiaries nuevos | — | **850** · 3 sedes · entrega &lt;12:00 · muchas dietas |

**No** cambian: tipos de producto, servicios, tipos de cliente (sigue Company Account + Beneficiary).  
**Solo** magnitud. Domingo 18:00 — cierre habitual de pedidos para la semana.

---

## Dimensión (≠ VS-001…004)

| VS | Dimensión |
|----|-----------|
| 001–004 | Adaptabilidad · Continuidad · Traza inversa · Recuperación error |
| **005** | **Sesgo de escala** — ¿objetos independientes del tamaño? |

---

## Auditoría — 8 pasos × 6 preguntas

### Paso 1 — Orders

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Order · Order Item · Company Account · Beneficiary · Weekly Menu | ✔ |
| Dependency | Actor `places` Order · Orders `aggregate into` Plan | ✔ |
| Transición | Confirm · (Amend VR-001) — **igual** a cualquier volumen | ✔ |
| Check | ¿Puede confirmarse? — por Order, no por «lote de 850» | ✔ |
| Invariant | INV-004 · INV-012 · INV-023 | ✔ |
| ¿Concepto nuevo? | Agregación tipo «Order Bundle» por volumen: **No** — Plan ya agrega | No |

**Notas:** Order sigue siendo la unidad de demanda. 850 Beneficiaries = n Orders (o líneas) bajo Company Account — ya modelado. **Confirmed.**

---

### Paso 2 — Production Planning

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Plan · Order · Recipe · Stock | ✔ |
| Dependency | Plan `fulfills` Orders · `uses` Recipe · `executes as` Batch | ✔ |
| Transición | Finalize / Start / (Revise) — significado **no** depende de N=180 | ✔ |
| Check | Stock vs necesidad — escala el **cálculo**, no el concepto | ✔ |
| Invariant | INV-050 · INV-023 · INV-034 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Un Plan semanal/día con 1.030 Orders sigue siendo el mismo objeto. **Confirmed.**

---

### Paso 3 — Production Batches

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Batch · Plan | ✔ |
| Dependency | Plan `executes as` Batch (1:n ya documentado) | ✔ |
| Transición | Planned → … → Completed — **N instancias**, mismo Lifecycle | ✔ |
| Check | Start / Complete por Batch — paralelismo permitido por modelo | ✔ |
| Invariant | INV-011 · INV-031 | ✔ |
| ¿Concepto nuevo? | **Production Session / Kitchen Shift como Core: No** — volumen ≠ capacidad nueva | No |

**Notas:** Multiplicar Batches es **instancia**. Shift/Session = coordinación temporal ya expresable con horarios de Batch + Kitchen (Supporting). Tentación de objeto nuevo = sesgo de escala. **Confirmed** (rechazo justificado).

---

### Paso 4 — Recursos (2 cocinas · 2 turnos · 2 vehículos)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | — (recursos no son espina) | — |
| Supporting | **Kitchen** · **Vehicle** · **Employee** | ✔ |
| Dependency | Batch en Kitchen · Route `employs` Vehicle | ✔ |
| Transición | — | — |
| Check | Capacidad Kitchen (VR-002) · Vehicle preparado | ⚠ docs débiles |
| Invariant | Ninguno fija Kitchen 1:1 | ✔ |
| ¿Concepto nuevo? | No — cardinalidad **n** Kitchen / Vehicle por Organization | No |

**Dictamen:** Forman parte del **dominio operativo** como Supporting (ya existen), no solo de infra.  
«A menudo una Kitchen» es **default de arranque**, no ley. **Clarified** — explicitar n:1 Organization→Kitchen/Vehicle en docs.

Turno = asignación temporal Employee/Batch/Kitchen — Configuration o atributo, **no** Core.

---

### Paso 5 — Logística (2 → 8 Routes)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Delivery Route · Delivery · Packaging | ✔ |
| Dependency | Route `transports` Packaging · `performs` Delivery | ✔ |
| Transición | Draft → Ready → Depart… — **igual** | ✔ |
| Check | Viabilidad ventana &lt;12:00 · INV-042 | ✔ |
| Invariant | INV-042 · INV-052 · INV-053 | ✔ |
| ¿Concepto nuevo? | «Super-ruta» / región como Core: **No** | No |

**Notas:** 8 Routes = 8 instancias. Tres sedes = ventanas/destinos en Delivery, no nuevo tipo. **Confirmed.**

---

### Paso 6 — Restricciones alimentarias (volumen)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Order · Dish · Packaging | ✔ |
| Supporting | Label · Beneficiary | ✔ |
| Dependency | Label `identifies` · Order Item → Dish | ✔ |
| Transición | Packaging Complete / Hold (VR-004) | ✔ |
| Check | Alergias · destinatario — **más instancias**, mismos Checks | ✔ |
| Invariant | INV-035 · INV-032 · INV-004 | ✔ |
| ¿Concepto nuevo? | «DietaryProfile» Core por volumen de dietas: **No** sin evidencia de capacidad nueva | No |

**Notas:** Decenas de dietas = más Labels/Checks, no nuevo dominio. **Confirmed.**

---

### Paso 7 — Coordinación (Wave / Shift / Execution Window)

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Plan · Batch · Packaging · Route | ✔ |
| Dependency | Orden causal INV-021 | ✔ |
| Transición | Plan In execution · Batches paralelos · Routes Ready | ✔ |
| Check | ¿Puede iniciarse / partir? — por objeto | ✔ |
| Invariant | INV-021 · INV-050…053 | ✔ |
| ¿Concepto nuevo? | Wave/Shift/Execution Window como Core: **No** | No |

**Explicación con modelo existente:**

- Horizonte del **Plan**  
- Ventana de **Route** (INV-042)  
- Secuencia Packaging → Hand to route → Depart  
- Paralelismo = múltiples Batches/Routes  

La coordinación informal que «rompe» al crecer es problema de **Capability/UX/proceso**, no de vocabulario de espina. **Confirmed** (rechazo). **Clarified** si se documenta explícitamente el paralelismo como first-class.

---

### Paso 8 — Fin de jornada / semana

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Mismos de la espina | ✔ |
| Dependency | Mismas | ✔ |
| Transición | Mismas | ✔ |
| Check | Mismos tipos | ✔ |
| Invariant | Mismos | ✔ |
| ¿Concepto nuevo? | No — creció la **instancia**, no el **modelo** | No |

**Notas:** Criterio específico de éxito: **cumplido**. **Confirmed.**

---

## Resumen

| Pregunta de la dimensión | Respuesta |
|--------------------------|-----------|
| ¿Core Objects independientes del tamaño? | **Sí** |
| ¿Lifecycles válidos con equipos en paralelo? | **Sí** (explicitar) |
| ¿Dependencies de dominio o de cocina pequeña? | **Dominio** — defaults documentales pequeños |
| ¿Coordinación Wave/Shift obligatoria? | **No** como Core |

| ID | Hallazgo | Local |
|----|----------|-------|
| H1 | Order / Plan aguantan 5×–10× | Confirmed |
| H2 | Batches = más instancias | Confirmed |
| H3 | Session/Shift Core rechazado | Confirmed |
| H4 | Kitchen/Vehicle n:1 poco explícito en docs | **Clarified** |
| H5 | 8 Routes OK | Confirmed |
| H6 | Dietas = volumen de Checks | Confirmed |
| H7 | Wave/Shift Core rechazado | Confirmed |
| H8 | Instancia creció · modelo no | Confirmed |

---

## Dictamen → VR-005

**Clarified** — primera clasificación no-Extended de la batería.

El modelo describe la **estructura del dominio**, no solo EatClean a 180 Orders.  
Hace falta precisión documental (cardinalidades · paralelismo), no redefinición.

Ver [VR-005](../05-validation-reports/VR-005-escalabilidad-eatclean.md) · [MC-005](../06-model-changes/MC-005-cardinality-parallelism-docs.md) ⏸.
