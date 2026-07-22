# 05 · Validation Reports

Cada hallazgo termina en un **dictamen trazable**.

Sin VR-xxx, el hallazgo no puede generar cambio en el modelo.

---

## Plantilla · VR-xxx

```markdown
# VR-xxx — [Título]

**Fecha:** YYYY-MM-DD  
**Origen:** VS-xxx · EC-xxx · FOV-xxx  
**Autor / sesión:** …

## Hallazgo

[Qué se intentó refutar y qué ocurrió]

## Cadena de comprobación (resumen)

| Capa | Resultado |
|------|-----------|
| Core Objects | … |
| Dependencies | … |
| Lifecycles | … |
| Checks | … |
| Invariants | … |

## Dictamen

[Uno de los cuatro]

## Justificación

[Por qué este dictamen]

## Acción requerida

| Dictamen | Acción |
|----------|--------|
| ✔ Modelo confirmado | Ninguna |
| ⚠ Ajuste menor | MC-xxx en 06-model-changes |
| 🔁 Ampliar Lifecycle | MC-xxx |
| 🚨 Rompe Invariant | MC-xxx + revisión Constitución |

## Model Change

MC-xxx (si aplica) · enlace
```

---

## Dictámenes

```text
✔  Modelo confirmado
⚠  Ajuste menor
🔁  Requiere ampliar (o corregir) un Lifecycle
🚨  Rompe (o tensiona críticamente) un Invariant
```

---

## Índice

Ver también [validation-coverage](./validation-coverage.md) — estabilidad del modelo.

| ID | Título | Origen | Dictamen | MC |
|----|--------|--------|----------|-----|
| — | *(vacío — correcto al inicio)* | — | — | — |

---

## Relacionado

- [06 model-changes](../06-model-changes/README.md)  
- [01 validation-principles](../01-validation-principles.md)
