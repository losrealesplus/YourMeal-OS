# Operational Discovery

**Tercer pilar documental de YourMeal OS**

| Pilar | Pregunta |
|-------|----------|
| [FOUNDATION](../../FOUNDATION.md) | ¿Cómo construimos? |
| [PRODUCT BLUEPRINT](../15-product/README.md) | ¿Qué construimos y por qué? *(fase diseño: cerrada)* |
| **OPERATIONAL DISCOVERY** | **¿Por qué evolucionar el producto?** *(qué hemos aprendido observando)* |

**Ahora:** Observation de campo ⏸ **congelada**. Prioridad del repo: [Operational Model](../17-operational-model/README.md).  
Checklist de campo (cuando se reactive): [FIRST_OBSERVATION_DAY.md](./FIRST_OBSERVATION_DAY.md).

---

## Misión

Capturar evidencia objetiva de cómo trabajan las Organizaciones para que la evolución de YourMeal OS esté guiada por la **realidad operativa** y no por hipótesis.

En particular: sacar a la luz los **Operational Checks implícitos** que hoy viven solo en la cabeza de las personas.

---

## Qué es / qué no es

Operational Discovery **no** diseña el producto.

**Observa** la operación.

Cada documento recoge evidencia obtenida durante el trabajo diario de clientes reales.

La evolución de YourMeal OS deberá justificarse mediante evidencia documentada en esta carpeta.

### Principio rector

```text
Primero observar.
Después comprender.
Después diseñar.
Después implementar.
```

### Regla de oro

> **Operational Discovery nunca contiene soluciones. Solo evidencia.**

Las soluciones viven en Product Blueprint o en las Capabilities.

Este espacio responde una sola pregunta:

> **¿Qué hemos aprendido observando la operación?**

### Disciplina de producto

> **En YourMeal OS no implementamos ideas. Implementamos conocimiento validado.**

---

## Documentos

| Documento | Propósito |
|-----------|-----------|
| [OPERATIONAL_FINDINGS.md](./OPERATIONAL_FINDINGS.md) | Diario de campo (OF-xxx) |
| [QUESTIONS_LIBRARY.md](./QUESTIONS_LIBRARY.md) | Backlog real: preguntas recurrentes |
| [TIME_LOSSES.md](./TIME_LOSSES.md) | Minutos perdidos (base del ROI) |
| [REPEATED_DECISIONS.md](./REPEATED_DECISIONS.md) | Decisiones diarias por memoria / papel |
| [WORKAROUNDS.md](./WORKAROUNDS.md) | Trucos manuales = oportunidades latentes |
| [INCIDENTS.md](./INCIDENTS.md) | Errores de operación (no bugs de software) |
| [VALIDATED_PATTERNS.md](./VALIDATED_PATTERNS.md) | Observaciones repetidas → listos para diseñar |
| [CAPABILITY_CANDIDATES.md](./CAPABILITY_CANDIDATES.md) | Puente Discovery → Blueprint (sin diseño técnico) |
| [FIRST_OBSERVATION_DAY.md](./FIRST_OBSERVATION_DAY.md) | Checklist de la primera jornada observada |

---

## Ciclo oficial de YourMeal OS

```text
Operación real
        ↓
Operational Discovery
        ↓
Patrón validado
        ↓
Product Blueprint
        ↓
Capability
        ↓
Use Cases
        ↓
Implementación
        ↓
Integración
        ↓
Operación real
```

La cocina alimenta al producto. El producto vuelve a la cocina.

**No hay cuarto pilar.** Todo nace de los tres.

---

## Flujo

```text
Observación
        ↓
Operational Finding
        ↓
Pregunta / Tiempo / Decisión / Workaround / Incidente
        ↓
Patrón validado (repetición)
        ↓
Capability Candidate
        ↓
Product Blueprint / Capability (fuera de esta carpeta)
```

---

## Reglas permanentes

1. **No registrar opiniones.** Solo observaciones.  
2. **No diseñar soluciones** aquí.  
3. **No crear Capabilities desde ideas.**  
4. **Toda Capability debe estar respaldada por evidencia** en esta carpeta.  
5. **Una observación aislada no cambia el producto.** Los patrones sí.  
6. **El cliente siempre tiene razón sobre su problema.** No necesariamente sobre la solución.

---

## Umbral

| Nivel | Acción |
|-------|--------|
| Observación aislada | Finding · estado pendiente |
| Repetición en varias jornadas | Subir a Questions / Time / Patterns |
| Patrón validado | Capability Candidate |
| Candidato priorizado | Diseño en Blueprint · luego implementación |

Ninguna Capability nueva entra en desarrollo sin evidencia operativa suficiente.

---

## Relacionado

- [Product Blueprint](../15-product/README.md)
- [Estado](../00-status/README.md)
