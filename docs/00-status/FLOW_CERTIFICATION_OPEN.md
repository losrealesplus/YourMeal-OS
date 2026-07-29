# Flow Certification · OPEN (framing)

**Documento:** `FLOW_CERTIFICATION_OPEN.md`  
**Fecha:** 2026-07-29  
**Estado:** ▶ **OPEN as certification** (ejecución Bloque G aún NOT STARTED en framing técnico)  
**No modifica FOPEBA.** No modifica Journey methodology FROZEN.  
**Framing técnico:** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md)

---

## Disciplina de apertura

Flow se abre con la **misma disciplina** que la Fase Plataforma: no como implementación de UI, sino como **certificación operacional**.

### Cadena correcta

```text
Outcome A
    ↓
Handoff
    ↓
Outcome B
    ↓
Evidence
    ↓
Certification
```

### Cadena incorrecta (rechazar)

```text
Pantalla
    ↓
API
    ↓
Componente
    ↓
PASS
```

Perdería la abstracción construida en Entry · Journey · Platform Baseline.

---

## Pregunta de Flow

> **¿Puede la empresa operar end-to-end?**

No: *¿funciona la pantalla de cocina?*  
Sí: *¿Kitchen entrega correctamente a Delivery (y el resto de handoffs)?*

---

## Objeto de certificación

| Capa | Objeto |
|------|--------|
| Entry | Superficie / landing |
| Journey | Outcome de departamento |
| **Flow** | **Transferencia (handoff)** entre Outcomes |

Actor = **organización**, no un solo departamento.

---

## Relación con Platform v1

Platform v1 está [CLOSED](./PLATFORM_V1_CLOSED.md).  
Transición institucional: [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · COMPLETE.  
Flow **consume** Baseline + Core Contract; **no** los redefine.

Garantías aplicables:

- Journey Outcomes verificables (Contract G4)  
- Flow consume Outcomes certificados (Contract G5)  
- Layer Independence: certificar Flow no reabre Journey  

---

## Criterio de éxito de un Flow

Un Flow está listo para certificación cuando:

1. Existen Outcomes A y B certificados (o elegibles) en Journeys  
2. El handoff es explícito y observable  
3. Hay evidencia reproducible (FOPEBA / RI)  
4. Un fallo de handoff no se “arregla” inventando pantallas sin Outcome  

---

## Disciplina diaria (Flow First)

| Documento | Rol |
|-----------|-----|
| [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) | Política permanente del repositorio (6 reglas) |
| [FLOW_FIRST](./FLOW_FIRST.md) | Toda feature → ¿a qué Flow pertenece? |
| [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md) | Done = Handoff → Evidence → Certification → Merge |
| [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md) | Spec → Execution → Evidence → Certification → Readiness |
| [FLOW_CATALOG](./FLOW_CATALOG.md) | FLOW-01 Kitchen→Delivery · FLOW-02 · FLOW-03 |

No mezclar conceptos. No PRs “Mejoras de Delivery” — solo `FLOW-NN` + departamentos.

---

## Siguiente paso de ejecución

Abrir ejecución del Bloque G según [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) — sin cambiar este framing de disciplina.
