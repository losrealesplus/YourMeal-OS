# Operational Certification Layer · Closed (Entry + Journey)

**Estado:** ✅ **LAYER CLOSED** · 2026-07-28  
**PR:** [#89](https://github.com/losrealesplus/yourmeal-os/pull/89)  
**Programa:** RI-001 · FOPEBA  

> Cierra una **capa completa de certificación** — no YourMeal OS.  
> Completa el **primer nivel operacional** (Entry + Journey) con marco estable.  
> **Flow** permanece pendiente de apertura explícita.

---

## Capas de certificación

| Capa | Pregunta | Estado |
|------|----------|--------|
| **Entry** | ¿Dónde entra el usuario? | ✅ CERTIFIED (EP-OPS-002) |
| **Journey** | ¿Puede cada departamento completar su trabajo? | ✅ COMPLETE · 4/4 CERTIFIED (EP-OPS-003) |
| **Flow** | ¿Puede la empresa operar end-to-end? | ⏳ Pendiente de apertura (Bloque G) |

Referencias: [EP-OPS-002 Entry](../10-validation/WORKSPACE_ENTRY_POLICY.md) · [Journeys COMPLETE](./EP_OPS_003_JOURNEYS_COMPLETE.md) · [Block G framing](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md)

---

## Cambio de paradigma

Hasta Entry + Journey, cada certificación tenía un único actor responsable:

```text
Actor
    ↓
Workspace
    ↓
Journey
    ↓
Outcome
```

A partir del Bloque G, el actor deja de ser un departamento y pasa a ser **la organización**.

El objeto de certificación cambia:

```text
Departamento
        ↓
Transferencia
        ↓
Departamento
```

El foco ya no es *«¿Kitchen funciona?»* sino *«¿Kitchen entrega correctamente a Delivery?»*.  
Esa diferencia es la esencia del Flow.

---

## Progresión FOPEBA (sin solapamientos)

```text
Foundation
        ↓
Identity
        ↓
Entry          ← capa cerrada
        ↓
Journey        ← capa cerrada
        ↓
Flow           ← siguiente (NOT STARTED)
        ↓
Operational Readiness
```

Cada etapa responde a una pregunta distinta y prepara la siguiente.

---

## Qué queda demostrado en esta capa

- Entry: aterrizaje correcto por rol / Workspace.
- Journey: Outcomes operacionales por departamento (Production Ready → … → Financial Records Complete).
- Estabilidad: FAIL/Correction downstream no reabre Journeys CERTIFIED.
- P13: Discovery → Evaluation → Correction → Re-Certification en Support y Accounting.
- Metodología Journey **FROZEN** y **probada**.

---

## Qué no implica este cierre

| No implica | Sí implica |
|------------|------------|
| YourMeal OS terminado | Primer nivel operacional íntegro |
| Bloque G abierto | Bloque G elegible |
| Operational Readiness firmada | Capacidad departamental + marco listo para Flow |
| Reabrir Entry/Journey | Mantener Outcomes como Input de handoffs |

---

## Camino a Operational Readiness

```text
Entry CERTIFIED
  +
Journey COMPLETE
  +
Flow CERTIFIED (handoffs)
        ↓
Operational Readiness
```

Readiness queda sustentada por la capacidad de cada departamento **y** por la calidad de sus transferencias — no por una sola de las dos.

---

## Disciplina para Bloque G (recomendación fijada)

Ver [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md):

- No certificar pantallas · componentes · APIs aisladas.
- Certificar únicamente **handoffs operacionales** con evidencia reproducible.
- Pregunta maestra por handoff: ¿el Outcome de A es consumido correctamente por B sin pérdida, sin intervención manual indebida, con trazabilidad?
