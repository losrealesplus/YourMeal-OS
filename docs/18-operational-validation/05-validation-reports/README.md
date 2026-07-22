# 05 · Validation Reports

Cada hallazgo termina en un **dictamen trazable**.

Sin VR-xxx, el hallazgo no puede generar cambio en el modelo.

---

## Clasificación de madurez (cada VR)

Además del símbolo de severidad, todo VR lleva una **clasificación de madurez**  
y debe actualizar [Knowledge State](../knowledge-state.md) de los elementos tocados.

| Clasificación | Significado | Knowledge State típico | Acción típica |
|---------------|-------------|------------------------|---------------|
| **Confirmed** | El modelo explica completamente el escenario | → **Validated** | Ninguna |
| **Clarified** | Modelo correcto; docs más precisas | → **Validated** (misma afirmación) | Ajuste texto 17 |
| **Extended** | Elemento nuevo con evidencia | nuevo → **Validated** | MC obligatorio |
| **Contradicted** | Parte del modelo incorrecta | anterior → **Refuted**; corrección → **Validated** | MC obligatorio |

### Lectura de tendencias

| Patrón en VR | Señal |
|--------------|-------|
| Mayoría Confirmed / Clarified | Modelo **convergiendo** |
| Predominio Extended / Contradicted | Modelo aún **evolucionando** — no acelerar implementación |

Registrar contadores en [validation-coverage](./validation-coverage.md).

### Correspondencia con severidad

| Clasificación | Símbolo habitual |
|---------------|------------------|
| Confirmed | ✔ |
| Clarified | ⚠ (doc) |
| Extended | 🔁 |
| Contradicted | 🚨 |

---

## Plantilla · VR-xxx

```markdown
# VR-xxx — [Título]

**Fecha:** YYYY-MM-DD  
**Origen:** VS-xxx · EC-xxx · FOV-xxx  
**Autor / sesión:** …  
**Participantes:** … (repetir escenario con distintos perfiles aumenta valor)

## Intención de la sesión

¿Qué tendría que pasar para que el modelo dejara de ser válido?

> Objetivo: **hacer fallar** el escenario, no «pasarlo».

## Hallazgo

[Qué se intentó refutar y qué ocurrió]

## ¿Se explicó con el modelo existente?

(Principio 13 — antes de proponer cambio)

| Intento | Resultado |
|---------|-----------|
| Explicación con vocabulario actual | Posible / Imposible |
| ¿Concepto nuevo necesario? | Sí / No |

## Cadena de comprobación (resumen)

| Capa | Resultado |
|------|-----------|
| Core Objects | … |
| Dependencies | … |
| Lifecycles | … |
| Checks | … |
| Invariants | … |

## Clasificación de madurez

**[Confirmed | Clarified | Extended | Contradicted]**

## Severidad

**[✔ | ⚠ | 🔁 | 🚨]**

## Justificación

[Por qué esta clasificación]

## Acción requerida

| Clasificación | Acción |
|---------------|--------|
| Confirmed | Ninguna |
| Clarified | Precisar docs 17 · MC opcional |
| Extended | MC-xxx obligatorio |
| Contradicted | MC-xxx + revisión Invariants si aplica |

## Model Change

MC-xxx (si aplica) · enlace

## Knowledge State

Elementos actualizados · enlace a [registry](../knowledge-state-registry.md)

| Elemento | KS anterior | KS nuevo | Proveniencia |
|----------|-------------|----------|--------------|
| … | … | … | VR-xxx |
```

---

## Índice

Ver también [validation-coverage](./validation-coverage.md) — estabilidad del modelo.

| ID | Título | Origen | Clasificación | MC |
|----|--------|--------|---------------|-----|
| [VR-001](./VR-001-modificacion-tardia-eatclean.md) | Modificación tardía EatClean | VS-001 Adaptabilidad | **Extended** | [MC-001](../06-model-changes/MC-001-amend-and-revise-transitions.md) ⏸ |
| [VR-002](./VR-002-interrupcion-horno-eatclean.md) | Interrupción horno EatClean | VS-002 Continuidad | **Extended** | [MC-002](../06-model-changes/MC-002-pause-batch-replan-execution.md) ⏸ |
| [VR-004](./VR-004-error-humano-etiquetas.md) | Etiquetas cruzadas Packaging | VS-004 Recuperación | **Extended** | [MC-004](../06-model-changes/MC-004-packaging-hold-relabel.md) ⏸ |

---

## Relacionado

- [06 model-changes](../06-model-changes/README.md)  
- [01 validation-principles](../01-validation-principles.md)  
- [audit-protocol](../02-validation-scenarios/audit-protocol.md)
