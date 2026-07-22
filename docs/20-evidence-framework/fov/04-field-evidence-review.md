# Field Evidence Review (FER)

Documento corto entre FOV y Knowledge Update.

> Protege al modelo frente a cambios precipitados derivados de un único caso de campo.

**KU no arranca** sin FER cerrado (o «FER: sin candidatos a KU» explícito).

---

## Único objetivo — cuatro preguntas

1. ¿Qué hipótesis quedaron **confirmadas**?  
2. ¿Qué hipótesis quedaron **refutadas**?  
3. ¿Qué hipótesis siguen **sin suficiente evidencia**?  
4. ¿Qué observaciones merecen convertirse en **Knowledge Update**?

---

## Plantilla FER-xxx

```markdown
# FER-xxx — Field Evidence Review · [campaña / período]

**Organización:** EatClean  
**Período:** …  
**FO incluidos:** FO-001…  
**Fecha:** …

## 1. Hipótesis confirmadas

| ID | Evidencia (FO) | Nota |
|----|----------------|------|
| H-… | FO-… (FO-V) | … |

## 2. Hipótesis refutadas

| ID | Evidencia (FO) | Nota |
|----|----------------|------|
| H-… | FO-… (FO-C) | … |

## 3. Hipótesis insuficientes

| ID | Por qué FO-U / cobertura | Próxima observación |
|----|--------------------------|---------------------|
| H-… | … | Ventana #… |

## 4. Candidatos a Knowledge Update

| FO | Código | ¿Por qué escala? | Acción propuesta |
|----|--------|------------------|------------------|
| FO-… | FO-E / FO-C | Repetible / material / estructural | KUR-… / VR-… / aparcar |

## Decisión

- [ ] Abrir Knowledge Update (lista KUR)
- [ ] No abrir KU — solo elevar ECL / archivar
- [ ] Más FO requeridas antes de decidir

## Firmas / sesión
…
```

---

## Índice

| ID | Período | Decisión | Estado |
|----|---------|----------|--------|
| — | *(vacío hasta cierre de campaña FOV)* | | ⏸ |

---

## Gobierno

```text
FO (clasificadas)
      ↓
FER (4 preguntas)
      ↓
├─ Sin KU → KUR-null → EC
└─ Con KU → [ku/ Workflow](../ku/02-workflow.md) → KUR → (VR/MC) → EC → G-01
```

Nota: Economic Confirmation sigue **después** de consolidar conocimiento ([ku/](../ku/README.md) · [ec/](../ec/README.md)).  
Si FER no abre KU, emitir KUR-null y EC usa el RC + FO-V acumuladas como refuerzo empírico.

---

## Relacionado

- [05 Knowledge Update](../05-knowledge-update.md)  
- [03 Field Observations](./03-field-observations.md)
