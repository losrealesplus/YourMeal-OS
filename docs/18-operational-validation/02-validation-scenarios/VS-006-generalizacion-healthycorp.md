# VS-006 — Escenario Hostil · Generalización del dominio (HealthyCorp)

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-006](../05-validation-reports/VR-006-generalizacion-healthycorp.md)  
**Clasificación:** **Clarified** · severidad ⚠ (con extensiones controladas ya aparcadas · **0** Core nuevos)  
**Dimensión:** **Generalización** — ¿el modelo describe EatClean o el dominio?  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)

---

## Objetivo

Demostrar (o refutar) que el Operational Model es lo bastante abstracto para soportar un cliente con reglas **radicalmente distintas**, sin redefinir conceptos fundamentales.

> No: «¿Puede EatClean hacer esto?»  
> Sí: **«¿Puede OPE explicar esta operación con el mismo modelo?»**

**Restricción:** prohibido crear Core Objects salvo evidencia irrefutable.  
Cada concepto nuevo: ¿dominio nuevo o **configuración** del mismo dominio?

---

## Criterio específico de éxito

Toda diferencia se clasifica en **exactamente una**:

| Código | Categoría |
|--------|-----------|
| **C** | Configuración del tenant (no cambia el modelo) |
| **R** | Regla de negocio (Checks / Invariants · sin Core nuevos) |
| **E** | Extensión controlada (Lifecycle / Dependency / Supporting ya previsto) |
| **X** | Contradicción estructural (falta concepto **fundamental** → Core o ley nueva) |

---

## Contexto

| | |
|--|--|
| **Tenant nuevo** | HealthyCorp Catering (no EatClean) |
| **Dominio** | Comida preparada — hospitales · residencias · colegios |
| **Setup** | Solo configuración · **0** líneas de código |

### Diferencias operativas (mismo dominio)

Cocina central + satélites · 365 días · prep 24h vs mismo día · emergencias · menús prescritos · dietas que cambian varias veces al día · entregas a habitación/planta/aula/excursión

### Día de estrés (primera semana)

| Evento | Hecho |
|--------|-------|
| 06:30 | Hospital modifica **150** dietas |
| — | Residencia **cancela** almuerzo (brote) |
| — | Colegio +**80** picnics (excursión) |
| — | Ambulancia · comida **urgente** paciente nuevo |
| — | **Dos** cocinas · mismo menú en paralelo |
| — | Entrega **redirigida** · paciente cambia de planta |

---

## Auditoría — 8 pasos × 6 preguntas

### Paso 1 — Tenant

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | **Organization** (Tenant) | ✔ | — |
| Dependency | Organization `owns` todos los objetos | ✔ | — |
| Transición | Alta Organization | ✔ | — |
| Check | — | — | — |
| Invariant | INV-010 | ✔ | — |
| ¿Concepto nuevo? | No — nuevo Tenant = datos + config | No | **C** |

**Notas:** El modelo **no** cambia al crear HealthyCorp. **Confirmed.**

---

### Paso 2 — Orders (prescripciones médicas)

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | Order · Order Item · Beneficiary · Company Account (hospital) | ✔ | — |
| Dependency | Actor `places` Order · Item `references` Dish | ✔ | — |
| Transición | Confirm · Amend (MC-001) · Cancel | ✔ | **E** (Amend ya aparcado) |
| Check | ¿Puede confirmarse? + ¿prescripción completa? | ✔ | **R** |
| Invariant | INV-004 · INV-012 · INV-032 | ✔ | — |
| ¿Concepto nuevo? | Order ≠ «PrescriptionOrder» — atributos/reglas en Item | No | **C**/**R** |

**Notas:** Prescripción no convierte Order en otro objeto. **Confirmed** + **R**.

---

### Paso 3 — Producción (varias cocinas)

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | Production Plan · Production Batch | ✔ | — |
| Supporting | Kitchen (n) | ✔ | **C** (VS-005) |
| Dependency | Plan `executes as` Batch · Batch en Kitchen | ✔ | — |
| Transición | Mismo Lifecycle · paralelo | ✔ | — |
| Check | Capacidad / Start por Batch | ✔ | **R** |
| Invariant | INV-011 · INV-050 | ✔ | — |
| ¿Concepto nuevo? | Coordinador inter-cocinas Core: **No** | No | — |

**Notas:** Alineado VR-005. **Confirmed.**

---

### Paso 4 — Consumers / dietas volátiles

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | Beneficiary (paciente/alumno) · Order · Order Item | ✔ | — |
| Dependency | Company Account `contracts for` Beneficiary · places Order | ✔ | — |
| Transición | Amend Order / Items (dieta del **servicio**) | ✔ | **E** |
| Check | Label/alergias · ¿puede modificarse dieta? | ✔ | **R** |
| Invariant | INV-004 · INV-015 · INV-035 | ✔ | — |
| ¿Concepto nuevo? | Dieta «vive» en **Order Item** (demanda del momento); perfil en Beneficiary = config/alergias base | No | **C**/**R** |

**Notas:** Consumer/Beneficiary **sigue** siendo el destinatario. Tres cambios/día = tres Amendments o Items por slot — no nuevo Core «DietChange». Weekly Menu: período puede ser **día/slot** (definición ya «período») — **C** granularidad. **Confirmed.**

---

### Paso 5 — Delivery (habitación · planta · aula · excursión)

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | Delivery · Delivery Route · Order · Beneficiary | ✔ | — |
| Supporting | **Location** hoy *reservado* | ⚠ | **E** |
| Dependency | Delivery `confirms` a destinatario · Route `transports` | ✔ | — |
| Transición | Redirect planta = actualizar destino antes/durante Attempted | ⚠ | **E** |
| Check | ¿Puede confirmarse entrega? · ¿destino válido? | ✔ | **R** |
| Invariant | INV-014 · INV-041 | ✔ | — |
| ¿Concepto nuevo? | Location como **Core: No**. Activar Location **Supporting** (ya reservado) o atributo estructurado en Delivery | No Core | **E** |

**Notas:** Delivery **sigue** siendo el hecho de entrega. El destino operativo fino (planta/habitación) no está canónico — evidencia para promover Location Supporting (filtro 02: no espina). **No X.** Clasificación **E** (MC-006).

---

### Paso 6 — Cambios en tiempo real (Route en marcha)

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| Core Objects | Order · Route · Delivery · Plan · Batch | ✔ | — |
| Dependency | Espina + Amend/Revise | ✔ | — |
| Transición | Nuevos Orders · Cancel · prioridad · Revise Route mid-flight | ⚠ | **E** |
| Check | ¿Puede añadirse parada? ¿Puede cancelarse en ruta? | ⚠ | **R** |
| Invariant | INV-020 · INV-022 · INV-043 | ✔ | — |
| ¿Concepto nuevo? | No — urgencia = Order + Plan expedito (1 Order) + Delivery | No | **C**/**E** |

**Emergencia ambulancia:** Plan de un solo Order + Batch + Packaging + Delivery — respeta INV-050 sin Core «EmergencyOrder». **Confirmed** patrón · **E** documentar camino expedito (solape MC-001/002).

**Cancel brote / +80 picnics:** Cancel + Confirm/Amend — objetos existentes. **C**/**R**.

---

### Paso 7 — Operational Checks

| Pregunta | Respuesta | ¿Coherente? | Cat. |
|----------|-----------|-------------|------|
| ¿Checks «nuevos»? | Prescripción completa · destino planta · SLA urgente · dieta slot | — | — |
| ¿Dominio nuevo o parámetros? | **Parametrizaciones** de Confirm · Complete · Hand to route · Depart · Amend | ✔ | **R** |
| Invariant | INV-054 · INV-043 | ✔ | — |
| ¿Concepto nuevo? | No | No | — |

**Notas:** **Confirmed** — no familia nueva de Checks; mismas preguntas, umbrales distintos.

---

### Paso 8 — Invariants (revisión de constitución)

| INV | ¿Válido en HealthyCorp? | ¿EatClean-only? | Cat. |
|-----|-------------------------|-----------------|------|
| INV-001…004 | ✔ | No | — |
| INV-010…015 | ✔ · 014 destino puede enriquecerse con Location | No | **E** menor |
| INV-020…024 | ✔ · Amend/Revise explicitan | No | **E** (MC-001/002) |
| INV-030…035 | ✔ | No | — |
| INV-040…044 | ✔ | No | — |
| INV-050…055 | ✔ · Plan expedito 1-Order OK | No | **C** |
| INV-032 Menu | ✔ si «período» = día/slot hospitalario | No | **C** |

**Ningún Invariant se contradice** ni depende de EatClean como empresa. Son **leyes del dominio** (con precisiones C/E). **Confirmed** constitución · **0 X**.

---

## Catálogo de diferencias (criterio específico)

| Diferencia HealthyCorp | Cat. | Notas |
|------------------------|------|-------|
| Nuevo Tenant | **C** | Organization |
| Prescripciones en pedido | **R**/**C** | Atributos Order Item · Checks |
| Dietas 3×/día | **R**/**E** | Amend / Items por slot |
| Granularidad menú día/slot | **C** | Weekly Menu = período |
| n Kitchen satélite | **C** | VS-005 |
| Emergencia mismo día | **C**/**E** | Plan expedito 1-Order |
| Destino planta/habitación/aula | **E** | Location Supporting |
| Redirect en ruta | **E** | Amend destino · Revise Route |
| Cancel brote · +picnics | **C**/**R** | Cancel · Confirm |
| Checks SLA / prescripción | **R** | Parametrización |
| Core nuevos de espina | — | **Ninguno** |
| Contradicción estructural (X) | — | **Ninguna** |

---

## Resumen

| Pregunta OPE | Respuesta |
|--------------|-----------|
| ¿El modelo describe EatClean o el dominio? | **El dominio** — HealthyCorp se explica sin Core nuevos |
| ¿10 Core nuevos? | **0** |
| ¿Universalidad rota? | **No** — extensiones controladas + config + reglas |

| ID | Hallazgo | Local |
|----|----------|-------|
| H1 | Tenant = C | Confirmed |
| H2 | Order + prescripción = R/C | Confirmed |
| H3 | Multi-Kitchen = C | Confirmed |
| H4 | Dieta en Order Item | Confirmed |
| H5 | Location Supporting | Extended controlado |
| H6 | Variabilidad tiempo real | Extended (MC previos) |
| H7 | Checks = R | Confirmed |
| H8 | Invariants = leyes de dominio · 0 X | Confirmed |

---

## Dictamen → VR-006

**Clarified** — el modelo **generaliza**.  
Extensiones necesarias ya estaban en cola (Amend · Revise · Hold) o son Supporting reservado (Location) — no redefinición de espina.

Ver [VR-006](../05-validation-reports/VR-006-generalizacion-healthycorp.md) · [MC-006](../06-model-changes/MC-006-location-supporting-expedite.md) ⏸.

---

## Fin de la primera campaña

| VS | Propiedad |
|----|-----------|
| 001 | Adaptabilidad |
| 002 | Continuidad |
| 003 | Trazabilidad / seguridad |
| 004 | Recuperación error humano |
| 005 | Escalabilidad conceptual |
| **006** | **Generalización / reutilización** |

**Siguiente (principio 16):** [análisis conjunto de brechas](../09-joint-gap-analysis.md) — priorizar MC-001…006 **antes** de tocar `17`.
