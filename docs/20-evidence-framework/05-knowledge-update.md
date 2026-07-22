# 05 · Knowledge Update

Parte del [Evidence Framework](./README.md).

Paso **explícito** **después** del [Field Evidence Review](./fov/04-field-evidence-review.md) y **antes** de Economic Confirmation.

> El conocimiento debe **consolidarse** antes de medir el valor económico.

Sin FER → KU, EC arriesga priorizar Capabilities sobre un modelo tensionado por anécdotas de campo.

**No diseñar KU en detalle hasta tener FO + FER.**  
Este documento fija el umbral; la campaña activa ahora es [FOV](./fov/README.md).

---

## Posición en el flujo

```text
FOV (FO-V/E/C/U)
    ↓
Field Evidence Review (FER)
    ↓
Knowledge Update    ← este paso (solo si FER autoriza)
    ↓
EC
    ↓
G-01
```

---

## Procedimiento de certificación (6 preguntas)

Cada candidato que el FER envió a KU, antes de tocar el modelo:

1. ¿Qué **observamos**?  
2. ¿Qué **evidencia** existe (FO / repetición)?  
3. ¿Qué **Knowledge State** cambia?  
4. ¿Qué **ECL** obtiene?  
5. ¿Qué **Stability** tiene / tendrá?  
6. ¿Necesita **MC**?

Más las [cuatro preguntas](#norma-no-toda-observación-modifica-el-conocimiento) de umbral.

Solo entonces se modifica el conocimiento.

---

## Norma — no toda observación modifica el conocimiento

Antes de MC / edición de `17`:

1. ¿Es **repetible** (o materialmente crítica)?  
2. ¿Qué **ECL** alcanza?  
3. ¿**Contradice** o solo **amplía**?  
4. ¿Justifica un **Model Change** (vs nota docs / Capability)?

FO-V → no KU.  
FO-U → no KU.  
FO-E / FO-C → solo tras FER.

---

## Artefacto · KUR-xxx

```markdown
# KUR-xxx — Knowledge Update post-FER

**Período / Org:** …  
**FER:** FER-…  
**FO de origen:** FO-…  
**Fecha:** …

## Cambios al modelo

| ID | Tipo | Resumen | MC |
|----|------|---------|-----|
| … | FO-E / FO-C → Extended / Clarified / Contradicted / ninguno | … | MC-… / — |

## ECL / Stability tocados

| Elemento | ECL antes → después | S antes → después |
|----------|---------------------|-------------------|
| … | 3 → 4 | S2 → S1 (si MC) |

## Listo para EC

- [ ] Sin FO-C estructural abierto sin decisión
- [ ] Capabilities candidatas ancladas al modelo actualizado
- [ ] Scorecard ECL revisado
```

---

## Regla

**EC no arranca** mientras exista FO-C estructural abierto sin decisión FER/KUR, o FO-E material sin aplicar / rechazar / aparcar con fecha.

---

## Relacionado

- [04 FOV](./04-field-operational-validation.md) · [fov/](./fov/README.md)  
- [FER](./fov/04-field-evidence-review.md)  
- [06 EC](./06-economic-confirmation.md)
