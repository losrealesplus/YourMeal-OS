# MC-002 — Pause Batch · Replan In execution · capacidad Kitchen

**Validation Report:** [VR-002](../05-validation-reports/VR-002-interrupcion-horno-eatclean.md)  
**Fecha:** 2026-07-22  
**Capa afectada:** Lifecycle Batch · Plan · Checks Kitchen · (amplía MC-001)  
**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

---

## Problema demostrado

VS-002: avería de horno con Plan **In execution**, Batch **In progress**, Packaging mixto, Routes en carga.

Sin Pause/Blocked el Batch viola INV-020 (queda “In progress” mentiroso).  
Sin Replan mid-execution no se reorganizan Batches Planned ni se reasignan Recipes frías/calientes.  
Kitchen existe pero no expresa capacidad.

---

## Cambio propuesto

### 1. Production Batch — **Pause / Block / Resume**

Estados adicionales (o evento sobre `In progress`):

```text
In progress → Blocked (Paused) → In progress (Resume)
In progress → Blocked → Closed  (si se abandona / fusiona — raro; documentar)
```

| | |
|--|--|
| **Evento** | Pause Production / Block Batch |
| **Responsable** | Cocina / gerencia |
| **Checks** | ¿**Puede pausarse**? · ¿**Puede reanudarse**? (capacidad · Stock · personal) |
| **Postcondiciones** | No `consumes` Stock adicional mientras Blocked · no `produces` Packaging nuevo |

### 2. Production Plan — **Revise Plan (In execution)**

Amplía MC-001:

| | |
|--|--|
| **Desde** | `In execution` |
| **Reglas** | Batches **Completed** inmutables · **In progress** → Pause antes de reasignar · **Planned** reordenables / reasignación Recipe si Check lo permite |
| **Checks** | ¿**Puede reorganizarse** el Plan en ejecución? |
| **Postcondiciones** | Mismo Plan (INV-011) · Batches actualizados · Orders siguen fulfilled |

**No** crear segundo Plan del día por defecto.

### 3. Kitchen — Checks de capacidad (Clarified → Extended menor)

Sin Core `Oven`:

| Check | Pregunta |
|-------|----------|
| Antes Start / Resume | ¿**Hay capacidad de cocción** para este Batch/Recipe? |
| Ante avería | ¿**Puede continuarse** con capacidad auxiliar? |

Opcional futuro (solo con evidencia Observation): Supporting **Equipment** bajo Kitchen — **nunca** Core.

### 4. Delivery Route

Reafirmar MC-001 **Revise Route** aplicable también con carga iniciada (antes de Departed o con regla de recall) — ventana Norte retrasada · Sur adelantada.

### 5. Explicitar fuera de modelo

| Concepto | Decisión |
|----------|----------|
| Notification | Capability / canal — no entra en 17 |
| Oven como Core | Rechazado |

### Archivos (al aplicar)

- `04-lifecycles/spine-transitions.md` (Batch · Plan)  
- `04-lifecycles/checks-on-transitions.md`  
- `02-core-objects/level-2-supporting.md` (Kitchen Checks)  
- Coordinar merge con **MC-001** (no duplicar Revise Ready)

---

## Impacto

| | |
|--|--|
| Invariants | Refuerza INV-020 · 054 · 011 · 043 |
| Core Objects | **0** nuevos |
| Capabilities | Production · Closing consumen Pause/Replan |

---

## Aprobación

- [ ] Constitución  
- [ ] Coordinado con MC-001  
- [ ] Aplicado en 17  

**Estado:** ✅ aplicado
