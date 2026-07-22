# 03 — Operational Dependencies

**FASE 4 · Operational Model**  
**Prerrequisito:** [02 Core Objects](../02-core-objects/consistency-review.md) ✅  
**Observation:** ⏸ congelada  

> No hablamos de «relaciones» genéricas.  
> Hablamos de **dependencias operativas**: flechas con **verbo**, **dirección dominante** y **pregunta** que responden.

No es un diagrama técnico. Es un **mapa de flujo operativo**.

**Regla:** conectar piezas ya definidas — **no** descubrir conceptos nuevos aquí.

---

## Principio

Las flechas tienen lenguaje.

| Mal | Bien |
|-----|------|
| `Order ↓ Production Plan` | `Orders` **aggregate into** `Production Plan` |
| `Recipe ↓ Ingredient` | `Recipe` **requires** `Ingredient` |

La diferencia no es cosmética: cambia quién depende de quién y qué Checks vigilan el vínculo.

---

## Reglas permanentes

### 1. Cada dependencia responde una pregunta

Ejemplo: **Production Plan** — ¿qué utiliza? → **Recipes** (vía **Dishes** en **Orders**).

### 2. Dirección dominante (nunca bidireccional por defecto)

Siempre existe un sujeto activo y un objeto.

- `Recipe` **requires** `Ingredient` ✅  
- `Ingredient` **requires** `Recipe` ❌

### 3. Verbos canónicos

Solo usar verbos del [catálogo](./verbs.md). Si falta uno → proponer con evidencia, no improvisar en código.

### 4. Checks viven en los vínculos

Ver [checks-at-edges.md](./checks-at-edges.md).

### 5. Supporting y Configuration no rompen la espina

Orbitan con verbos propios; no sustituyen eslabones Core.

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [verbs.md](./verbs.md) | Catálogo de verbos operativos |
| [spine-flow.md](./spine-flow.md) | Mapa de flujo (espina dorsal) |
| [support-dependencies.md](./support-dependencies.md) | Órbita: Recipe, Stock, Supplier… |
| [checks-at-edges.md](./checks-at-edges.md) | Checks en cada dependencia |

---

## Gate 03 → 04

> ¿Podemos describir **cómo funciona cualquier operación de comida preparada** solo con lenguaje canónico + dependencias nombradas?

Si sí → **04 · Lifecycles** detalla estados ya implícitos en el flujo.  
Si no → volver a 01/02, no inventar flechas.

**Veredicto interno (v0.1):** ✅ — ver [spine-flow.md](./spine-flow.md).

---

## Relacionado

- [01 Ubiquitous Language](../01-ubiquitous-language/README.md)  
- [02 Core Objects](../02-core-objects/README.md)  
- [04 Lifecycles](../04-LIFECYCLES.md) — siguiente  
- [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md)
