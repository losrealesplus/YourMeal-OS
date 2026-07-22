# 07 · Certification

## Operational Model Certified v1.0

No se cierra FASE 5 diciendo «está terminado».

Se cierra con un acto explícito:

> **Operational Model Certified v1.0**

El modelo deja de ser hipótesis endurecida.  
Pasa a ser **base validada contra operaciones reales** (o contra escenarios/edge cases acordados si el campo aún no está disponible).

---

## Criterios de certificación (propuesta)

Todos deben cumplirse:

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | Escenarios VS-001…007 ejecutados con VR | Índice [05](./05-validation-reports/README.md) |
| 2 | Edge cases EC-001…006 ejecutados con VR | Índice 05 |
| 3 | Ningún dictamen 🚨 sin MC aplicado o rechazo documentado | 06-model-changes |
| 4 | Field observation: mínimo acordado por equipo (o waiver explícito) | 04-field-observation |
| 5 | Constitución INV-001…055 revisada tras cambios | 05-invariants |
| 6 | Trazabilidad Dish (y Capabilities críticas acordadas) al día | 06-capability-mapping |
| 7 | Sin features ni código de producto añadidos durante FASE 5 | CHANGELOG / PRs |

El umbral de «mínimo en campo» lo fija el equipo al activar EatClean en modo validación.

---

## Waiver de campo

Si el campo no puede activarse a tiempo, el equipo puede certificar **solo con escenarios + edge cases** documentando:

- Motivo del waiver  
- Fecha de re-validación en campo obligatoria antes de pilot amplio  
- Riesgo aceptado

El waiver **no** sustituye certificación completa para pilot de producción real.

---

## Acto de certificación (plantilla)

```markdown
# Operational Model Certified v1.0

**Fecha:** YYYY-MM-DD  
**Versión del modelo:** commit / tag …  
**Sesión / responsables:** …

## Resumen

- Validation Reports cerrados: N  
- Model Changes aplicados: N (lista MC-xxx)  
- Field observation: completada / waiver (motivo)

## Declaración

Tras intentar refutar el Operational Model mediante escenarios,
edge cases y [observación de campo / waiver documentado],
el modelo se declara **certificado** como base permanente de YourMeal OS
hasta una nueva fase de validación mayor (v2.0).

## Próximo gate

Diseño visual · UX · implementación de Capabilities · integración EatClean
— siempre trazadas a modelo certificado.
```

---

## Estado actual

| Elemento | Estado |
|----------|--------|
| Operational Model Certified v1.0 | ⏳ **No certificado** |
| FASE 5 | 🚧 En curso (estructura + semillas) |

---

## Relacionado

- [README](./README.md)  
- [01 validation-principles](./01-validation-principles.md)  
- [Operational Model](../17-operational-model/README.md)
