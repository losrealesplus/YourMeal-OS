# Operational Discovery

**Etapa:** observar antes de desarrollar  
**Puente:** realidad operativa (EatClean) → Product Blueprint → Capabilities  
**No es:** Foundation · Product Blueprint · código

| Pilar | Pregunta |
|-------|----------|
| FOUNDATION | ¿Cómo construimos? |
| PRODUCT BLUEPRINT | ¿Qué construimos y por qué? |
| **OPERATIONAL DISCOVERY** | **¿Qué demuestra la cocina que debemos construir?** |

---

## Objetivo

No desarrollar.

**Observar.**

Regla:

> **Ninguna Capability nueva entra en desarrollo hasta que exista evidencia operativa suficiente de que elimina una pregunta recurrente o una decisión repetitiva.**

---

## Documentos

| Documento | Propósito |
|-----------|-----------|
| [OPERATIONAL_FINDINGS.md](./OPERATIONAL_FINDINGS.md) | Observaciones numeradas (OF-xxx) |
| [QUESTIONS_LIBRARY.md](./QUESTIONS_LIBRARY.md) | Preguntas recurrentes detectadas en campo |
| [TIME_LOSSES.md](./TIME_LOSSES.md) | Dónde se pierden minutos |
| [REPEATED_DECISIONS.md](./REPEATED_DECISIONS.md) | Decisiones que hoy dependen de memoria / papel / llamadas |

---

## Cómo se genera el backlog

```text
Observación en cocina
        ↓
Operational Finding (OF-xxx)
        ↓
Pregunta detectada
        ↓
Asistente implicado (Product Blueprint)
        ↓
Capability candidata (solo si hay evidencia repetida)
```

Ejemplo:

| Evidencia | Pregunta | Asistente | Capability candidata |
|-----------|----------|-----------|----------------------|
| Se olvidó descongelar pollo | ¿Qué debo dejar preparado antes de irme? | Closing Assistant | Production Preparation |
| Repartidor llamó tres veces | ¿Cuál es mi siguiente entrega? | Delivery Assistant | Route Execution |
| Se buscó una etiqueta varias veces | ¿Qué lleva esta bolsa? | Packaging Assistant | Packaging Verification |

El roadmap **sale de la cocina**, no de la pizarra.

---

## Umbral de evidencia (disciplina)

| Nivel | Significado | Acción |
|-------|-------------|--------|
| 1 observación | Hipótesis | Registrar OF · estado `pendiente` |
| Varias jornadas / repetición | Señal | Validar · enlazar Asistente |
| Evidencia suficiente (p. ej. patrón claro en ≥5 hallazgos o consenso de campo) | Necesidad demostrada | Puede entrar a priorización de Capability |

El número exacto puede afinarse; lo que no se negocia es: **sin evidencia, no hay desarrollo de Capability nueva**.

---

## Relacionado

- [Product Blueprint](../15-product/README.md)
- [PRODUCT_VISION](../15-product/PRODUCT_VISION.md)
- [CAPABILITY_ROADMAP](../15-product/CAPABILITY_ROADMAP.md)
- [Estado](../00-status/README.md)
