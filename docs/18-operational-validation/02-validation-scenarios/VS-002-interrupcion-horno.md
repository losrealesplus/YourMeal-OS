# VS-002 — Escenario Hostil · Interrupción operacional (horno)

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-002](../05-validation-reports/VR-002-interrupcion-horno-eatclean.md)  
**Clasificación:** **Extended** · severidad 🔁  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)  
**Nota gate:** MC-001 aún ⏳; VS-002 se ejecuta por decisión de sesión (familias distintas). Hallazgos de Plan/Route **In execution** amplían MC-001 → ver MC-002.

---

## Objetivo

Intentar romper el Operational Model cuando la operación **ya está ejecutándose** y un evento externo obliga a reorganizar parte del día.

> No validar la producción.  
> Validar **coherencia temporal** del modelo.

Pregunta continua: **¿el modelo sigue explicando lo que está ocurriendo?**

---

## Contexto

| | |
|--|--|
| **Organization** | EatClean Tenerife |
| **Momento** | Jueves **08:17** · producción lleva **47 min** |
| **Estado previo** | Coherente · Plan **In execution** |

### Situación inicial

- Weekly Menu **Published** · Orders cerrados/confirmados  
- Production Plan **aprobado / In execution**  
- Batch 1 **Completed** · Packaging Batch 1 **Complete**  
- Batch 2 **In progress**  
- Batch 3 **Planned / Pending**  
- Ruta Norte **cargándose** (Ready → hacia Depart)  
- Ruta Sur aún no  
- Ningún Order perdido — solo cambia **capacidad operativa**

---

## Evento (08:17)

Avería: **horno principal** fuera de servicio · ETA reparación **2 h**.

Consecuencias:

- 3 recetas calientes no terminan  
- 2 Production Batches bloqueados  
- Personal ocioso parcial  
- Ruta Norte no sale a la hora prevista  
- Ruta Sur podría adelantarse  
- Horno auxiliar menor capacidad · algunas Recipes pueden cambiar de Batch · otras no  
- Platos fríos pueden seguir  
- Packaging de calientes **aún no** empezó  

---

## Áreas tensionadas (≠ VS-001)

| VS-001 | VS-002 |
|--------|--------|
| Cambio comercial (Amend Order) | Continuidad operativa |
| Pre-Start | Mid-execution |
| Stock / Supplier | Recursos limitados · replan · logística · dominio vs Capability |

---

## Auditoría — 7 pasos × 6 preguntas

### Paso 1 — Producción · Batch In progress

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Batch · Production Plan · Recipe · Dish | ✔ |
| Dependency | Plan `executes as` Batch · Batch `uses` Recipe | ✔ |
| Transición | Estados: Planned · Ready to cook · **In progress** · Completed · Closed. **No existe Pause / Blocked** | ✗ |
| Check | ¿**Puede continuarse** / ¿**Puede pausarse** este Batch? — no documentado | ✗ |
| Invariant | INV-020 (transiciones explícitas) · INV-054 | ✔ (exigen el hueco) |
| ¿Concepto nuevo? | No Core. Falta **transición** Pause/Blocked | No (objeto) / Sí (transición) |

**Notas:** Completar a medias o “dejar In progress” sin evento viola INV-020. Cancel Batch no modelado. **Grieta #1 esperada.**

---

### Paso 2 — Planificación · reorganizar Batches

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Plan · Production Batch | ✔ |
| Dependency | Plan `executes as` Batch · `fulfills` Orders | ✔ |
| Transición | Plan **In execution**. MC-001 solo propone Revise en **Ready**. No hay Replan mid-execution / reasignar Recipes entre Batches | ✗ |
| Check | ¿**Puede reorganizarse** el Plan en ejecución? ¿Batch nuevo vs ajustar Planned? | ✗ |
| Invariant | INV-011 (Batch → un Plan) · INV-050 · INV-031 | ✔ |
| ¿Concepto nuevo? | No — no hace falta Plan nuevo si INV-011: mismo Plan, Batches ajustados | No |

**Notas:** Un Plan nuevo rompería continuidad sin evidencia. **Extended** — Revise Plan **In execution** (con reglas: no tocar Completed; Pause In progress; reordenar Planned).

---

### Paso 3 — Recursos · horno

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | — (horno **no** es Core) | — |
| Supporting | **Kitchen** existe · sin capacidad / equipos · Checks vacíos | ⚠ |
| Dependency | No hay `Kitchen employs Equipment` | ⚠ |
| Transición / Check | Disponibilidad de recurso **implícita** en “personal asignado” del Start · no en mid-Batch | ✗ |
| Invariant | Ninguno dice “horno”; INV-043 Check no decide | ✔ |
| ¿Concepto nuevo? | **Oven como Core: No** (falla filtro espina). Opciones: (A) Check + Pause sin objeto equipo · (B) Supporting **Equipment** bajo Kitchen | Ver dictamen |

**Dictamen local (principio 13):**

1. Primero explicar con Pause Batch + Check «¿hay capacidad de cocción?» sin inventar Core.  
2. Si Observation exige inventario de hornos → Supporting **Equipment** (Nivel 2), **nunca** Core.  
3. **Notification** / “Horno” como entidad de espina = rechazo.

**No Contradicted** — el modelo no afirma que el horno sea un Core. Sí **Extended/Clarified**: capacidad física no está representada.

---

### Paso 4 — Packaging

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Label · Production Batch | ✔ |
| Dependency | Batch `produces` Packaging | ✔ |
| Transición | Batch 1 Packaging **Complete** — intacto. Calientes **Pending** — pueden permanecer Pending | ✔ |
| Check | ¿**Puede iniciarse** Packaging? → No hasta Batch Completed (INV-051) | ✔ |
| Invariant | INV-030 · INV-051 · INV-035 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** No reiniciar Packaging Complete del Batch 1. Pending no obliga Complete. **Confirmed.**

---

### Paso 5 — Ruta

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Delivery Route · Packaging · Delivery · Vehicle | ✔ |
| Dependency | Route `transports` Packaging · Delivery `performs` | ✔ |
| Transición | Retraso Norte = ventana / orden · no nuevo Delivery por Order. Sur adelantar = misma Route u otra | ⚠ |
| Check | ¿**Puede partir** la Route? · ¿**Puede revisarse** Ready/carga? (MC-001 Revise Route) | Parcial |
| Invariant | INV-042 · INV-022 · INV-053 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Cambia **horario/secuencia** de Route (y Deliveries Pending), no la identidad del Order. Depende de Revise Route (aún propuesto). **Confirmed** condicionado a MC-001/002.

---

### Paso 6 — Comunicación

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Ninguno nuevo | ✔ |
| Dependency | — | — |
| Transición | Delivery / Route estados ya expresan retraso | ✔ |
| Check | — | — |
| Invariant | INV-044 Capabilities no definen leyes · INV-002 | ✔ |
| ¿Concepto nuevo? | **Notification como Core: No** (explícito Nivel 3 / fuera de espina) | No |

**Notas:** Aviso a Consumers/Beneficiaries = **Capability** (u orquestación) que **consume** Delivery/Route/Order. Crear `Notification` en el modelo operativo = sobre-modelado. **Confirmed** — separación dominio / auxiliar.

---

### Paso 7 — Facturación / Payment

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Payment · Order · Delivery | ✔ |
| Dependency | Payment `settles` Order | ✔ |
| Transición | Retraso de Delivery **no** obliga cambio de Payment (salvo reglas cobro-en-ruta) | ✔ |
| Check | ¿**Puede liquidarse**? — independiente del ETA de Route | ✔ |
| Invariant | INV-040 · INV-024 — **no se rompen** | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** **Confirmed.**

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Pasos | 7 / 7 |
| Core Objects nuevos exigidos | **0** |
| Grietas Lifecycle | Pause/Blocked Batch · Replan In execution · capacidad Kitchen |
| Pasos Confirmed | 4, 6, 7 (+5 condicionado) |

| ID | Hallazgo | Local |
|----|----------|-------|
| H1 | No Pause/Blocked en Production Batch | Extended |
| H2 | No Replan Plan **In execution** | Extended |
| H3 | Capacidad horno no modelada (Kitchen vacío) | Clarified → Extended menor |
| H4 | Packaging Pending/Complete coherente | Confirmed |
| H5 | Route = ventana/secuencia, no nuevo objeto | Confirmed* |
| H6 | Notification ≠ dominio | Confirmed |
| H7 | Payment intacto | Confirmed |

---

## Dictamen → VR-002

**Extended** — continuidad temporal exige transiciones mid-execution; recursos físicos no son Core; comunicación no entra en el modelo.

Ver [VR-002](../05-validation-reports/VR-002-interrupcion-horno-eatclean.md) · [MC-002](../06-model-changes/MC-002-pause-batch-replan-execution.md).
