# Interpretation Findings (IF-A · IF-R · IF-D · IF-L)

Origen: [IVR-003](../ivr/IVR-003-iov003-independent-implementation.md).

| Código | Significado |
|--------|-------------|
| **IF-A** | Arquitectura diferente, mismo modelo |
| **IF-R** | Responsabilidad ambigua |
| **IF-D** | Dependencia interpretada de forma distinta |
| **IF-L** | Lifecycle interpretado de forma distinta |

---

## Índice

| ID | Código | Título | ¿Bloquea RC? | Estado |
|----|--------|--------|--------------|--------|
| IF-001 | IF-A | Naming Bounded Contexts | No | ✅ cerrado |
| IF-002 | IF-A | Checks: BC vs Domain Service | No | ✅ |
| IF-003 | IF-A | Naming servicios Amend/Settlement | No | ✅ |

---

## IF-001 — Naming Bounded Contexts

| Campo | Valor |
|-------|-------|
| Código | IF-A |
| Diseño A | Packaging & Identity · Logistics · … |
| Diseño B | Unit Assembly · Last-Mile Logistics · … |
| ¿Mismo concepto? | Sí |
| ¿Bloquea RC? | No |

---

## IF-002 — Checks como contexto vs servicio

| Campo | Valor |
|-------|-------|
| Código | IF-A |
| Diseño A | Domain Service OperationalCheckEvaluator |
| Diseño B | Bounded Context Transition Governance + Evaluator |
| ¿Mismo concepto? | Sí — INV-043 / Checks 2.0 |
| ¿Bloquea RC? | No |

---

## IF-003 — Naming servicios

| Campo | Valor |
|-------|-------|
| Código | IF-A |
| Diseño A | SettlementService · AmendImpactService |
| Diseño B | SettlementPolicyService · AmendImpactPropagator |
| ¿Mismo concepto? | Sí |
| ¿Bloquea RC? | No |

---

## Relacionado

- [03 Independent Implementation](../03-independent-implementation.md)
