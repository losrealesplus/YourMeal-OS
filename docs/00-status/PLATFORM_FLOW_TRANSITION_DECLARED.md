# PLATFORM → FLOW TRANSITION DECLARED

**Documento:** `PLATFORM_FLOW_TRANSITION_DECLARED.md`  
**Fecha:** 2026-07-29  
**Estado:** **COMPLETE**  
**Tipo:** Acta institucional de transición  
**No modifica FOPEBA.** No redefine Core. No ejecuta Flow.  
**Anclas:** [PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md) · [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)

---

## Declaración

La Plataforma v1 queda **oficialmente finalizada**.

A partir de este punto, YourMeal OS deja de evolucionar mediante decisiones estructurales y pasa a evolucionar mediante **evidencia operacional**.

Esto no cierra solo una fase técnica: **institucionaliza una forma de desarrollar**.

---

## Principios vigentes

```text
Foundation                🔒
Auth                      🔒
Identity                  🔒
Operational Core          🔒
Governance                🔒
Flow                      ▶ Current
```

Toda evolución futura deberá **consumir** estas capas.  
Ninguna podrá **redefinirlas** sin evidencia operacional y siguiendo [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md).

---

## Nuevo criterio de ingeniería

El repositorio adopta oficialmente el siguiente modelo:

```text
Flow
    ↓
Specification
    ↓
Implementation
    ↓
Evidence
    ↓
Certification
    ↓
Merge
```

El desarrollo deja de estar orientado a funcionalidades y pasa a estar orientado a **operación certificable**.

Detalle: [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md).

---

## Nueva definición de valor

El progreso del producto **deja de medirse** por:

- número de pantallas;
- número de funcionalidades;
- número de PRs.

Y **pasa a medirse** por:

- Flows especificados;
- Flows ejecutados;
- Flows certificados;
- Operational Readiness alcanzada.

---

## Regla permanente

Toda modificación del sistema deberá responder, **antes de comenzar**:

```text
¿A qué Flow pertenece?
¿Qué Outcome produce?
¿Qué Handoff mejora?
¿Qué evidencia permitirá certificarlo?
```

Si estas preguntas no pueden responderse, el cambio **no está operacionalmente justificado**.

Política: [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · Regla diaria: [FLOW_FIRST](./FLOW_FIRST.md).

---

## Criterio de cierre

| Afirmación | Estado |
|------------|--------|
| Plataforma v1 cerrada | ✅ |
| Baseline v1 congelada | ✅ |
| Flow Governance ACTIVE | ✅ |
| Pregunta abierta: ¿cómo opera YourMeal OS? | ▶ Flow Certification |

Las siguientes decisiones arquitectónicas deberán estar motivadas por **evidencia operacional** obtenida durante la certificación de Flow o durante la operación real del producto.

---

## Secuencia institucional (PR #89 → #98)

```text
Journeys
    ↓
Identity
    ↓
Operational Core
    ↓
Platform Governance
    ↓
Platform Baseline
    ↓
Platform Closed
    ↓
Flow Discipline
    ↓
Flow Governance
    ↓
Platform → Flow Transition DECLARED  ← esta acta
```

No es una colección de documentos: es la transición ordenada desde **construir el sistema** hasta **demostrar que el sistema opera correctamente**.

---

## Consecuencia

A partir de ahora, cada nueva capacidad deberá justificar su existencia por:

1. el valor que aporta a un **Flow operacional**, y  
2. la **evidencia** que genera,

no simplemente por añadir una funcionalidad más.

---

## Firma

| Campo | Valor |
|-------|-------|
| Decisión | Platform → Flow Transition **DECLARED · COMPLETE** |
| Platform | v1 CLOSED |
| Fase actual | Flow Certification ▶ CURRENT |
| Lenguaje oficial | Operación certificable ([FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md)) |
| Knowledge Lifetime | Iteration *(acta inmutable al cierre de transición)* |
