# Recipe (Receta)

**Término ubicuo:** Recipe  
**Línea:** Recipe Ingredient  
**Módulo:** Recipe Builder (secuencia Module 01 / catálogo)  
**Persistencia actual:** agregado sobre `dish_ingredients`  
**Estado del documento:** 🚧 Borrador de dominio  
**Código:** inglés · **Docs:** español

---

## Responsabilidad

Una **Recipe** es la **composición** de un Dish: conjunto ordenado/lista de Ingredients con cantidades canónicas.

Ejemplo:

- Chicken breast — 200 g  
- Soy sauce — 15 ml  
- Rice — 150 g  

Es el puente reutilizable: un Ingredient vive en muchas Recipes; un Dish tiene una Recipe (1:1 conceptual en v1).

---

## Invariantes

1. Toda línea pertenece a un Dish y un Ingredient del **mismo tenant**.
2. Cantidades (`qty`) en unidad canónica coherente con el Ingredient / convención (`unit`).
3. No hard-delete de negocio del Dish vía borrar líneas a ciegas sin Service.
4. Una Recipe no existe sin Dish (agregado raíz = Dish en v1).
5. Capabilities: `recipes.read` / `recipes.write`.
6. Cambios de Recipe pueden invalidar caches de coste — el Service decide si recalcula `dishes.cost`.

---

## Estados

La Recipe en v1 **no tiene state machine propia**: vive con el ciclo de vida del Dish.

Reglas:

- Si Dish está `archived`, la Recipe no se edita (salvo restore del Dish).
- Si Dish está `draft`/`published`, Recipe editable según `recipes.write`.

(Si más adelante versionamos recipes, ADR.)

---

## Relaciones

| Relación | Entidad | Cardinalidad |
|----------|---------|--------------|
| Dish | Dish | N líneas : 1 Dish (agregado) |
| Ingredient | Ingredient | N:1 por línea |
| Tenant | Tenant | desnormalizado en `dish_ingredients.tenant_id` |

Tabla: `dish_ingredients (dish_id, ingredient_id, tenant_id, qty, unit)`.

---

## Reglas de negocio

- Añadir línea: Ingredient activo (no archivado); qty > 0.
- Quitar línea: permitido en draft/published; audit.
- Sustituir Ingredient: update línea o delete+insert vía Service.
- Publicar Dish con Recipe vacía: **decidir** — propuesta v1: permitir draft vacío; **bloquear publish** si Recipe vacía (regla de negocio a confirmar en Service).
- Coste Dish: opcionalmente suma(qty × ingredient.cost) en canonical units — fórmula en Service, no en UI.

---

## Casos límite

| Caso | Tratamiento |
|------|-------------|
| Recipe vacía al publicar | Rechazar publish (`INVALID_RECIPE`) — propuesta |
| Ingredient archivado ya en Recipe | Conservar línea; no ofrecer en altas nuevas |
| Unidad incompatible (g vs ml) | Validar en Service |
| Mismo Ingredient dos veces en un Dish | ¿Permitir? Propuesta v1: **una fila por par dish+ingredient** (PK actual) — qty única |
| Dish de otro tenant | Imposible vía RLS + checks |

---

## Eventos que genera (futuro)

| Evento | Cuándo |
|--------|--------|
| (posible) `RecipeUpdated` | Cambio de composición |
| Puede disparar recálculo de coste / purchasing hints | Futuro |

---

## Eventos que consume

| Evento | Efecto posible |
|--------|----------------|
| `Ingredient` archivado / coste cambiado | Recalcular o marcar Dish “coste desactualizado” (futuro) |

---

## Capacities

`recipes.read`, `recipes.write`. Matriz oficial en seguridad.

---

## Objetivos de este documento

Fijar que **Recipe ≠ Dish ≠ Ingredient** antes de cualquier pantalla de Recipe Builder.
