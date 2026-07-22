# Operational Dynamics v0.2

**Milestone:** enriquecer el comportamiento del Operational Model  
**No es:** cambio de arquitectura · nueva espina · nuevos Core Objects de dominio  
**Sí es:** capacidad de describir **operaciones reales** — cambio, interrupción, recuperación, ejecución continua

```text
FASE 4 · Gramática (01–06)     → qué existe y qué es ley
FASE 5 · Validation (VS-001…006) → dónde fallaba el comportamiento
Dynamics v0.2 (este bloque)    → cómo se mueve la operación sin romper la espina
```

Origen de evidencia: [batería VS](../18-operational-validation/02-validation-scenarios/README.md) · [análisis de brechas](../18-operational-validation/09-joint-gap-analysis.md).

---

## Qué no cambia

| Capa | Estado |
|------|--------|
| Espina Menu → … → Payment | Intacta |
| Core Objects Nivel 1 | Sin altas por Dynamics |
| Constitución (INV-*) | Sin reescritura; se **usa** mejor |
| Jerarquía Invariant → Lifecycle → Check → Capability | Intacta |

---

## Tres entregables

| # | Documento | Integra |
|---|-----------|---------|
| 01 | [Operational Lifecycles 2.0](./01-operational-lifecycles-2.0.md) | **Operational Transition** · Recovery Pattern · Temporal Grammar · Capability Impact |
| 02 | [Supporting Objects Taxonomy](./02-supporting-objects-taxonomy.md) | Resources · Traceability · Spatial · Administrative |
| 03 | [Operational Checks 2.0](./03-operational-checks-2.0.md) | PASS · WARNING · BLOCKED · MANUAL DECISION · Check → Result → Next Transition |

No abrir veinte documentos. Estos tres bastan.

---

## Relación con MC aparcados (FASE 5)

Dynamics v0.2 es el **marco** que unifica MC-001…006 antes de aplicar parches a `04-lifecycles` objeto a objeto.

| Familia Dynamics | MC que absorbe |
|------------------|----------------|
| Operational / Protection transitions | MC-001 Amend/Revise · MC-002 Pause/Replan · MC-004 Hold |
| Traceability + Spatial Supporting | MC-003 Lot · MC-006 Location |
| Checks 2.0 + MANUAL DECISION | Todos los VR (INV-043) |
| Recovery Pattern | VS-003 · VS-004 |
| Cardinalidad / paralelismo | MC-005 |

Aplicación a archivos de espina (`spine-transitions.md`, etc.): **después** de adoptar Dynamics v0.2 — un tren coherente, no seis PRs sueltos.

---

## Gate

> ¿El equipo puede narrar Amend · Hold · Quarantine · Resume · Recall con el vocabulario Dynamics sin inventar Core nuevos?

Si sí → aplicar MC al Lifecycle por objeto · subir Knowledge State · evaluar **Beta**.

---

## Relacionado

- [04 Lifecycles (v1)](../04-lifecycles/README.md)  
- [02 Core Objects · Supporting](../02-core-objects/level-2-supporting.md)  
- [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md)  
- [Estado](../../00-status/README.md)
