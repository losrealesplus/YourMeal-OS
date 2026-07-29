# FLOW GOVERNANCE

**Documento:** `FLOW_GOVERNANCE.md`  
**Fecha:** 2026-07-29  
**Status:** **ACTIVE**  
**Tipo:** Política permanente de desarrollo del repositorio  
**No modifica FOPEBA.** No redefine Core. No ejecuta Flow.  
**Complementa:** [FLOW_FIRST](./FLOW_FIRST.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md) · [PR_TAXONOMY](./PR_TAXONOMY.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)

---

## Purpose

Garantizar que todo desarrollo operacional nace desde un Flow certificado o candidato.

Convierte en **política permanente** lo ya decidido en Platform v1 CLOSED → Flow Certification (#96–#98): el desarrollo está guiado por la operación, no por las pantallas.

Acta institucional: [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · COMPLETE.  
Constitución operativa: [OPERATING_MODEL_v1](./OPERATING_MODEL_v1.md) · ACTIVE.

---

## Reasoning (oficial)

```text
Antes
  Implemento una funcionalidad
      ↓
  Abro una PR
      ↓
  Merge

Ahora
  Existe un Flow
      ↓
  Ese Flow necesita una capacidad
      ↓
  Implemento únicamente esa capacidad
      ↓
  Genero evidencia
      ↓
  Certifico el Flow
      ↓
  Merge
```

---

## REGLA 1 — No existen PRs huérfanas

Toda PR pertenece a **exactamente una** de:

| Categoría | Ancla |
|-----------|--------|
| **FLOW-XX** | [FLOW_CATALOG](./FLOW_CATALOG.md) · [PR_TAXONOMY](./PR_TAXONOMY.md) Flow Certification |
| **Operational Module** | Consume Core; declara Flow afectado |
| **Operational Service** | Tras necesidad demostrable de un Flow |
| **Bug Fix** | Restaura Flow / Journey / contrato |
| **Documentation** | Sin cambio de comportamiento |

Sin categoría → ❌.

---

## REGLA 2 — Toda Feature declara explícitamente

| Campo | Obligatorio |
|-------|-------------|
| **Flow afectado** | `FLOW-NN` o justificación de Flow nuevo / excepción |
| **Journey implicado** | Source / Target (p. ej. Kitchen → Delivery) |
| **Outcome esperado** | Qué Outcome mejora o habilita |

Plantilla: [`.github/pull_request_template.md`](../../.github/pull_request_template.md).

---

## REGLA 3 — Toda Feature nueva debe responder

```text
¿Qué Handoff mejora?
```

Si no mejora ninguno → debe **justificar por qué** (Bug Fix / Documentation / Service exigido por evidencia / excepción documentada).  
Sin handoff y sin justificación → ❌ ([FLOW_FIRST](./FLOW_FIRST.md)).

---

## REGLA 4 — No existen desarrollos guiados por pantallas

```text
Las pantallas implementan Flows.
Nunca los definen.
```

Una UI sin Flow / Handoff / Outcome declarado no es trabajo de fase Flow Certification.

---

## REGLA 5 — La evidencia pertenece al Flow

La evidencia **no** pertenece a la pantalla, al componente ni a la API aislada.

Cadena válida: Outcome → Handoff → Evidence → Certification ([FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md)).

---

## REGLA 6 — Operational Readiness solo por Flows certificados

Operational Readiness se calcula mediante **Flows certificados**.  
**Nunca** por número de funcionalidades, pantallas o PRs mergeadas.

Jerarquía: [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md).

---

## Estructura de épicas (consecuencia)

El backlog operacional se organiza por **valor operacional (Flow)**, no por módulo:

```text
❌  EP-Orders · EP-Kitchen · EP-Delivery

✅  FLOW-01  Kitchen → Delivery
✅  FLOW-02  Delivery → Support
✅  FLOW-03  Support → Accounting
```

Bajo cada Flow:

```text
Spec
  ↓
Implementation
  ↓
Evidence
  ↓
Certification
```

Catálogo: [FLOW_CATALOG](./FLOW_CATALOG.md).

---

## Consecuencia práctica

| Antes | Ahora |
|-------|--------|
| El Core define cómo se desarrolla | Flow define **qué** merece desarrollarse |
| Feature = Done | Certificación = Done |
| Backlog por módulos / pantallas | Backlog por handoffs |

---

## END

| Campo | Valor |
|-------|-------|
| Status | ACTIVE |
| Ámbito | Todo desarrollo operacional del repositorio |
| Reapertura / cambio de esta política | Evidencia operacional + ADR · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) |
