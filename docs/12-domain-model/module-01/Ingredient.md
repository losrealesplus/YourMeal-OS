# Ingredient (Ingrediente)

**Término ubicuo:** Ingredient  
**Módulo:** Ingredient Library (secuencia Module 01 / catálogo)  
**Persistencia actual:** `ingredients` (+ `suppliers`)  
**Estado del documento:** 🚧 Borrador de dominio  
**Código:** inglés · **Docs:** español

---

## Responsabilidad

Un **Ingredient** es una **materia prima** o input comprable/reutilizable (ej. pechuga de pollo, salsa de soja, arroz).

Puede formar parte de cientos de platos vía **Recipe**.  
No es un plato vendible (eso es **Dish**).

---

## Invariantes

1. Pertenece a un único tenant.
2. `name` obligatorio.
3. Unidades canónicas en almacenamiento de stock/qty (gramos / ml según tipo; convención ADR 0001).
4. Soft delete: `archive` / `restore`; `purge` solo SaaS Admin.
5. Stock (`stock`, `min_stock`) es numérico canónico; no strings de UI.
6. Alérgenos en estructura canónica (hoy `text[]`).
7. Mutaciones auditadas cuando el Service exista.

---

## Estados

No hay enum de ciclo de vida comercial como Dish (aún).

Estados operativos previstos:

| Estado | Significado |
|--------|-------------|
| Active | `deleted_at IS NULL` — usable en recipes |
| Archived | soft-deleted — no nuevas recipes; históricas conservan id |

(Si más adelante hace falta `draft`/`discontinued`, ADR + state machine.)

---

## Relaciones

| Relación | Entidad | Notas |
|----------|---------|-------|
| Tenant | Tenant | Obligatorio |
| Supplier | Supplier | Opcional (`supplier_id`) |
| RecipeIngredient | Recipe line | N usos en recipes |
| Inventory | Inventory Item (futuro) | Hoy stock embebido en fila |

---

## Reglas de negocio

- Crear/actualizar: capabilities `ingredients.create|update`.
- Archivar: no debe romper recipes históricas; ocultar en selector de Recipe Builder.
- Cambiar coste: impacto en coste de Dish es **cálculo de aplicación** (no mutar precio Dish automáticamente sin regla explícita).
- Unidad: al vincular en Recipe, la qty usa unidad canónica coherente con el ingrediente.

---

## Casos límite

| Caso | Tratamiento |
|------|-------------|
| Archivar ingrediente usado en recipes activas | Permitir archive; Recipe Builder no lo ofrece; platos existentes conservan líneas |
| Stock negativo | Rechazar o flag crítico — decidir en Inventory module; por ahora validar ≥ 0 en Service |
| Sin supplier | Permitido |
| Nombre duplicado por tenant | TBD en Ingredient Library |

---

## Eventos que genera (futuro)

| Evento | Cuándo |
|--------|--------|
| (posible) `IngredientCreated` | Alta |
| `InventoryUpdated` | Cambio de stock (módulo Inventory) |

---

## Eventos que consume

Ninguno en el arranque. Futuro: compras (`PurchaseOrder` recibido) actualizan stock.

---

## Capacities

`ingredients.read|create|update|archive` (+ write compuesto). Matriz: [CAPABILITY_MATRIX.md](../../09-security/CAPABILITY_MATRIX.md).

---

## Objetivos de este documento

Separar materia prima del plato comercial **antes** de Recipe Builder y UI.
