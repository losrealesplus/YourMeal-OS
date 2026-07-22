# Retrospectiva metodológica (post VS-001)

**Cuándo:** inmediatamente después de cerrar VS-001 y VR-001 — **antes** de abrir VS-002.  
**Estado:** 🚧 borrador tras auditoría documental — completar con sesión de equipo

**Objetivo:** validar la **herramienta** con la que validáis el modelo.

---

## Criterio de éxito de VS-001

> **«Cada hallazgo produjo una decisión trazable.»**

✔ Cumplido: H1–H8 → VR-001 → MC-001 propuesto · registry actualizado · 0 Core Objects nuevos.

---

## Preguntas de la retrospectiva

### Protocolo de auditoría

| Pregunta | Respuesta (borrador) |
|----------|----------------------|
| ¿El protocolo indujo algún sesgo? | Riesgo bajo: se contrastó `docs/17` **después** del mapeo por paso |
| ¿Responder antes de abrir `docs/17` fue viable? | Sí en auditoría documental |
| ¿La sexta pregunta fue clara? | Sí — separó «Core nuevo» (No) de «transición faltante» (Sí) |
| ¿La sesión intentó hacer fallar el escenario? | Sí — Escenario Hostil 001 con 8 tensores simultáneos |

### Evidencia y VR

| Pregunta | Respuesta (borrador) |
|----------|----------------------|
| ¿Las seis preguntas fueron suficientes? | Sí; añadir subpregunta «¿Cancel explica el evento?» ayudó en Paso 1 |
| ¿Alguna evidencia quedó fuera? | FOV campo (ETA proveedor real) — mesa no sustituye Observation |
| ¿Clasificación VR clara? | Extended vs Contradicted: criterio «Core nuevo / Invariant falso» funcionó |
| ¿Cada hallazgo con VR trazable? | Sí |

### Knowledge State y proveniencia

| Pregunta | Respuesta (borrador) |
|----------|----------------------|
| ¿KS cambió de forma consistente? | Parcial Validated donde Lifecycle incompleto — convención útil |
| ¿Proveniencia fácil? | Sí (VS-001 · VR-001 · Alpha) |
| ¿Registry necesita más? | Columna «parcial» documentada en notas |

### Equilibrio epistemológico

| Pregunta | Respuesta (borrador) |
|----------|----------------------|
| ¿Sesgo proteger el modelo? | Evitado: no se forzó Cancel como «solución» |
| ¿Sesgo añadir objeto? | Evitado: PO sigue Supporting |
| ¿Contradicted como derrota? | N/A — dictamen Extended |

---

## Decisiones de mejora del proceso

| # | Ajuste propuesto | ¿Aplica a VS-002+? | Estado |
|---|------------------|-------------------|--------|
| 1 | En Paso Amend-like: preguntar explícitamente si Cancel/recreate explica el hecho | Sí | ⏳ adoptar |
| 2 | Distinguir en tabla «concepto nuevo» = Core vs transición vs Check | Sí | ⏳ adoptar |
| 3 | No abrir VS-002 hasta aplicar o rechazar formalmente MC-001 | Gate | ⏳ |

---

## Gate VS-001 → VS-002

- [x] VR-001 cerrado con clasificación Extended  
- [x] knowledge-state-registry actualizado  
- [ ] Esta retrospectiva **firmada por el equipo**  
- [ ] MC-001 aplicado o rechazado documentado  

Solo entonces abrir VS-002.

---

## Relacionado

- [VS-001](./02-validation-scenarios/VS-001-semana-normal.md)  
- [VR-001](./05-validation-reports/VR-001-modificacion-tardia-eatclean.md)  
- [MC-001](./06-model-changes/MC-001-amend-and-revise-transitions.md)
