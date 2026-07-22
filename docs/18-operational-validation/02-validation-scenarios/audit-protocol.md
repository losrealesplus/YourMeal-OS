# Protocolo de auditoría (por paso)

Cada escenario y observación de campo se ejecuta como **auditoría**, no como walkthrough informal.

> Nadie asume el resultado. Cada paso debe **demostrar** coherencia o revelar una grieta.

---

## Las seis preguntas (por cada paso operativo)

| # | Pregunta | Capa del modelo | Objetivo |
|---|----------|-----------------|----------|
| 1 | ¿Qué **Core Objects** participan? | 02 Sustantivos | Validar vocabulario |
| 2 | ¿Qué **Dependency** se recorre? | 03 Verbos | Validar semántica |
| 3 | ¿Qué **transición** ocurre? | 04 Tiempo | Validar evolución |
| 4 | ¿Qué **Check** habilita el cambio? | Checks | Validar operación |
| 5 | ¿Qué **Invariant** protege este paso? | 05 Constitución | Validar leyes |
| 6 | ¿Necesitamos **inventar un concepto nuevo** para explicar este paso? | Filtro 02 | Detectar grieta |

### La sexta pregunta (la más importante)

> **¿Necesitamos inventar un concepto nuevo para explicar este paso?**

| Respuesta | Significado |
|-----------|-------------|
| **Sí** | Grieta detectada → VR (mínimo ⚠; a menudo 🔁 o 🚨) |
| **No** | El modelo gana evidencia a favor (acumula en Validation Coverage) |

No confundir con «alias de cocina» (Nivel 2/3). La pregunta es sobre **Core Objects** y **Dependencies** canónicos.

---

## Plantilla por paso

```markdown
### Paso N — [Evento operativo]

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | … | ✔ / ✗ |
| Dependency | … | ✔ / ✗ |
| Transición | … | ✔ / ✗ |
| Check | … | ✔ / ✗ / N/A |
| Invariant | INV-… | ✔ / ✗ |
| ¿Concepto nuevo? | Sí / No | — |

**Notas de auditoría:** …
```

Si cualquier fila es ✗ o «concepto nuevo = Sí» → documentar en VR antes de continuar.

---

## Disciplina de sesión

1. **Un facilitador** lee el paso; **no** anticipa el mapeo al modelo.  
2. El grupo responde las seis preguntas **antes** de mirar la documentación 17.  
3. Solo entonces se contrasta con [Operational Model](../17-operational-model/README.md).  
4. Discrepancias → VR, no debate oral sin dictamen.

---

## Relacionado

- [VS-001 — Semana normal](./VS-001-semana-normal.md) (primera auditoría)  
- [05 validation-reports](../05-validation-reports/README.md)  
- [validation-coverage](../05-validation-reports/validation-coverage.md)
