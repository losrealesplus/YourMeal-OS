# 01 — Operational Lifecycles 2.0

**Operational Dynamics v0.2**  
**Prerrequisito:** [04 Lifecycles v1](../04-lifecycles/README.md) · evidencia VS-001…006  
**No añade Core Objects.** Añade el concepto **Operational Transition**.

---

## De estados a transiciones

Hasta Dynamics, la lectura habitual era:

```text
Draft → Active → Archived
```

La operación real es:

```text
State  →  Transition  →  State
```

Los **Operational Checks viven en las transiciones**, no en los estados (principio ya en v1 · INV-054).

Lifecycles 2.0 hace explícita la **clase** de cada transición para que Amend, Hold o Recall no parezcan «excepciones vergonzantes», sino gramática operativa.

---

## Clasificación de Operational Transitions

### 1. Happy Path

Flujo nominal de creación y cierre.

| Transición (ej.) | Uso |
|------------------|-----|
| Create | Nace el objeto |
| Activate / Publish / Confirm | Entra en compromiso |
| Start / Complete | Ejecución |
| Archive | Sale del operativo diario |

Ejemplos espina: Confirm Order · Start Production · Complete Packaging · Confirm Delivered · Settle Payment.

### 2. Operational Transition

Cambios **normales** de la operación (no son fallos).

| Transición | Evidencia VS |
|------------|--------------|
| **Amend** | VS-001 · VS-006 (dietas, líneas) |
| **Revise** | VS-001 · VS-002 (Plan / Route) |
| **Replan** | VS-002 (Plan In execution) |
| Split / Merge / Duplicate | Escala / Batches (usar con filtro; no inventar Core) |
| **Resume** | Tras Pause (VS-002) |

> Amend ≠ Cancel. Revise ≠ crear Plan nuevo.

### 3. Protection Transition

Protegen la operación ante riesgo o inconsistencia.

| Transición | Evidencia VS |
|------------|--------------|
| **Hold** | VS-004 (Packaging) |
| **Release** | Tras corrección / validación |
| **Quarantine** | VS-003 (Packaging / Stock / Lot) |
| **Pause / Suspend** | VS-002 (Batch) |
| **Resume** | Salida de protección |

Hold y Quarantine pueden unificarse semánticamente por objeto (Packaging): misma familia Protection — matices en Checks.

### 4. Exceptional Transition

Poco frecuentes; siempre con evento explícito (INV-020).

| Transición | Evidencia / nota |
|------------|------------------|
| **Recall** | VS-003 — evento/Supporting, no Core |
| **Cancel** | Ya en v1 (Order) |
| **Void** | Label (Supporting) |
| Purge / Rollback | Archive≠Purge (INV-003); Rollback solo con evento auditado |

---

## Plantilla de transición (v2)

Además de la [plantilla v1](../04-lifecycles/transition-template.md):

| Campo | Contenido |
|-------|-----------|
| **Clase** | Happy · Operational · Protection · Exceptional |
| **Desde → Hacia** | Estados |
| **Evento** | Nombre canónico |
| **Check(s)** | Preguntas en la transición |
| **Resultados posibles** | PASS · WARNING · BLOCKED · MANUAL DECISION → ver [Checks 2.0](./03-operational-checks-2.0.md) |
| **Impactos posibles** | Ver sección Capability Impact |
| **Adverbio temporal** | Before / During / After… (gramática temporal) |

---

## Recovery Pattern (reutilizable)

Patrón observado en VS-003 · VS-004 · (parcial VS-002):

```text
Detect
  ↓
Hold          ← Protection
  ↓
Investigate
  ↓
Correct       ← Operational (Amend / Void+reapply / Replan…)
  ↓
Validate      ← Check(s)
  ↓
Release       ← Protection
  ↓
Continue      ← Happy / Resume
```

| Sirve para | No es |
|------------|--------|
| Etiquetas · retirada · producción · logística · stock | Una Capability |
| Comportamiento operativo transversal | Un Core Object |

La Capability (Packaging Assistant, Closing…) **orquesta** el patrón; no lo inventa.

---

## Capability Impact (dependencias explícitas)

Cuando ocurre una Transition, **puede** afectar otros objetos — no siempre.

```text
Transition
    ↓
Possible Impacts   (qué podría moverse)
    ↓
Affected Objects   (qué se mueve en este caso)
    ↓
Checks
    ↓
Next Transition
```

### Ejemplo — Amend Order (VS-001)

| | |
|--|--|
| **Transition** | Amend Order (Operational) |
| **Possible Impacts** | Plan · Batch · Stock · Packaging · Route · Payment · Label |
| **Affected (caso 15:42)** | Plan Revise · Batch Planned · Stock Check · Route Revise · Payment importe · Label si alérgenos |
| **No afectados** | Batches Completed · Packaging Complete de otros Orders |
| **Checks** | ¿Puede modificarse? · Stock · Menu · alérgenos · ventana Route |
| **Next** | Revise Plan (si Ready/In execution) · o solo Items si Plan aún Draft |

Regla: **puede afectar ≠ debe regenerar todo.** Elimina dependencias implícitas («si tocas Order, rompes Route»).

---

## Temporal Grammar (adverbios operativos)

No son estados nuevos de la espina. Son **vocabulario temporal** para hablar de transiciones y Checks.

| Adverbio | Uso |
|----------|-----|
| Before | Precondiciones · Checks previos |
| During | In progress · In execution · en ruta |
| After | Postcondiciones · evidencia |
| Pending | Esperando evento |
| Ready | Listo para transición Happy |
| In Progress | Ejecución activa |
| Blocked | Protection / Check BLOCKED |
| Waiting | Esperando recurso · MANUAL DECISION · ETA |
| Completed | Hecho operativo |
| Released | Sale de Hold/Quarantine |
| Cancelled | Exceptional · abandono |

Ejemplo de frase operativa:

> *During* Batch In progress, oven fails → **Pause** (Protection) → *Waiting* capacity → **Resume** (Operational) → *After* Complete.

---

## Mapa rápido: transición → objetos típicos

| Clase | Order | Plan | Batch | Packaging | Route |
|-------|-------|------|-------|-----------|-------|
| Happy | Confirm | Finalize · Start | Start · Complete | Complete · Hand | Depart · Complete |
| Operational | Amend | Revise · Replan | (ajuste Planned) | Relabel vía Label | Revise |
| Protection | — | — | Pause | Hold · Quarantine | (stop / Hold carga) |
| Exceptional | Cancel | — | — | Void vía Label | — |

Detalle por objeto: aplicar en tren post-Dynamics usando MC-001…004.

---

## Relacionado

- [README Dynamics](./README.md)  
- [Checks 2.0](./03-operational-checks-2.0.md)  
- [Supporting Taxonomy](./02-supporting-objects-taxonomy.md)
