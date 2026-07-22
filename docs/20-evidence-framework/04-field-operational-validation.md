# 04 · Field Operational Validation (FOV)

Parte del [Evidence Framework](./README.md).  
**Fase obligatoria** de FOPEBA — no anexo.

---

## Hipótesis A / Objetivo preciso

FOV **no** vuelve a validar el modelo en abstracto (eso ya ocurrió en mesa + IOV).

Valida que:

> **La realidad confirma el conocimiento** — produce la misma evidencia que predijo el modelo.

Observar operación (EatClean). **No** enseñar app · **no** vender · **no** proponer · **no** intervenir. Solo registrar.

Clasificar observaciones (KS): Observed → Validated / Refuted / path to Generalized.

Medir: decisiones · tiempos · preguntas · incidencias · interrupciones · trabajo manual · excepciones.

Salida: **Field Validation Report (FVR)** · FORs.

**Cuándo abrir:** solo tras IOV-001…003 + [Operational Model RC](../../00-status/02-operational-model-rc.md).

---

## Principio de sorpresa

FOV no solo confirma.

También debe **intentar sorprender**.

> **Toda campaña FOV debe intentar descubrir al menos un comportamiento no previsto.**

No porque tenga que existir.  
Sino porque obliga al equipo a salir a observar con actitud **exploratoria**, no únicamente verificadora.

Una campaña sin ningún Extended/Clarified/Contradicted y sin “comportamiento no previsto” registrado debe justificar por escrito por qué la exploración fue suficiente (raro).

---

## Lo que NO debe hacerse

**No llevar el modelo al negocio** para «enseñárselo» o forzar el vocabulario.

Ahora se hace lo **contrario**: observar la realidad y ver si **produce** el modelo.

---

## Método (etnográfico)

Durante varios días:

- observar;
- preguntar;
- registrar;
- **no intervenir**.

Después convertir cada observación en:

```text
Realidad → Evento → Objeto → Lifecycle → Checks → Invariants
```

Y comparar con el Operational Model publicado.

Plantilla de campo: [04-field-observation](../18-operational-validation/04-field-observation/README.md).

---

## Clasificación

| Dictamen | Significado |
|----------|-------------|
| **Confirmed** | La realidad produjo exactamente el modelo |
| **Extended** | Comportamiento nuevo (incluye sorpresas) |
| **Clarified** | Correcto; faltaba precisión |
| **Contradicted** | La realidad desmintió el modelo |

---

## Productos

### FOR — Field Observation Report

```markdown
# FOR-xxx — [Momento / escena]

**Organización / fecha:** …
**¿Comportamiento no previsto?** Sí / No

## Realidad (sin opinión)
…

## Cadena
| Paso | Contenido |
|------|-----------|
| Evento | … |
| Objeto(s) | … |
| Lifecycle | … |
| Checks | … |
| Invariants | INV-… |

## Dictamen
Confirmed · Extended · Clarified · Contradicted
```

### Field Validation Report (FVR)

Resumen de campaña · conteo de dictámenes · sorpresas · ECL candidatas a elevar.

Tras FVR → [05 Knowledge Update](./05-knowledge-update.md) **antes** de EC.

---

## Gobierno

```text
FOR → FVR → Knowledge Update → (VR/MC si aplica) → EC
```

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| FOV | ⏳ No ejecutado |
| FOR / FVR | — |

---

## Relacionado

- [05 Knowledge Update](./05-knowledge-update.md)  
- [06 Economic Confirmation](./06-economic-confirmation.md)  
- [02 ECL](./02-evidence-confidence-levels.md)
