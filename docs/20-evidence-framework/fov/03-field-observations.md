# Field Observations (FO)

Origen de campaña: [FOV](../04-field-operational-validation.md) · Protocolo: [00](./00-experimental-protocol.md).

> Primero evidencia. Luego decisiones.  
> Una FO **no** es un Model Change.

---

## Clasificación

| Código | Significado |
|--------|-------------|
| **FO-V** | Confirma el modelo |
| **FO-E** | Extiende el conocimiento sin romper el Core |
| **FO-C** | Contradice una hipótesis certificada |
| **FO-U** | Observación aún insuficiente para concluir |

---

## Plantilla FO-xxx

```markdown
# FO-xxx — [Momento / escena]

**Organización / fecha:** EatClean · YYYY-MM-DD  
**Ventana del plan:** #…  
**Hipótesis tocadas:** H-…  
**¿Comportamiento no previsto?** Sí / No  
**Observador:** …

## Realidad (sin opinión)

[Lenguaje de cocina — qué ocurrió]

## Señales

| Señal | Nota |
|-------|------|
| Decisiones | … |
| Tiempos / rework | … |
| Preguntas oídas | … |
| Incidencias | … |
| **Knowledge Leakage** | Sí / No — ¿decisión correcta que vive en una persona, no en el modelo? |

### Knowledge Leakage

> Toda decisión operacional correcta que depende del conocimiento implícito de una persona y no del modelo.

No es error. Es fuga. Suele alimentar Checks / heurísticas / Capabilities — no Core por defecto.

Si KL = Sí, describir la regla tácita en lenguaje de cocina (sin implementar).

## Mapeo posterior (fuera de campo)

| Paso | Contenido |
|------|-----------|
| Evento | … |
| Objeto(s) | … |
| Lifecycle | … |
| Checks | … |
| Invariants | INV-… / — |

## Clasificación

FO-V · FO-E · FO-C · FO-U

## ¿Candidata a FER / KU?

Sí / No · motivo breve
```

Compatibilidad: el antiguo dictamen Confirmed/Extended/Clarified/Contradicted se mapea así:

| Legado | FO |
|--------|-----|
| Confirmed | FO-V |
| Extended (sin romper Core) | FO-E |
| Clarified | FO-E (docs) o FO-V si solo precisión verbal |
| Contradicted | FO-C |
| Insuficiente / anecdótico | FO-U |

---

## Índice

| ID | Título | Código | Hipótesis | ¿FER? | Estado |
|----|--------|--------|-----------|-------|--------|
| — | *(vacío hasta ejecución)* | | | | ⏸ |

---

## Relacionado

- [01 Hypotheses](./01-hypotheses-from-rc.md)  
- [04 FER](./04-field-evidence-review.md)
