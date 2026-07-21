# SupabaseDishRepository — Especificación de implementación

**Tipo:** especificación de un adaptador concreto (no es Guidelines)  
**Contrato:** [DishRepository.md](./DishRepository.md) / `DishRepository.ts`  
**Hito:** [Infrastructure Validation](../00-status/MILESTONE_INFRASTRUCTURE_VALIDATION.md)  
**Código previsto:** `src/modules/dish-library/infrastructure/supabase-dish-repository.ts`

> El Core no sabe que Supabase existe.  
> Este documento solo describe cómo un adaptador cumple el contrato.

---

## Propósito

Implementar el contrato `DishRepository` mediante Supabase (PostgreSQL + RLS), traduciendo Domain ↔ Persistence **sin reglas de negocio**.

---

## Cómo implementa el contrato

| Operación del contrato | Comportamiento del adaptador |
|------------------------|------------------------------|
| `save` | Upsert de la fila mapeada (`id` + `tenant_id`) |
| `findById` | Select por tenant + id; excluye archivados (`deleted_at IS NULL` y status ≠ archived) |
| `existsByName` | Existencia de nombre en tenant entre no archivados |
| `listNotArchived` | Listado del tenant no archivado, orden por `name` |
| `findByIdIncludingArchived` | Select por tenant + id sin filtrar archivo |
| `purge` | `DELETE` físico por tenant + id |

Autorización, unicidad de negocio y transiciones de estado **no** viven aquí.

---

## Tablas

| Tabla | Uso |
|-------|-----|
| `public.dishes` | Persistencia del agregado Dish |

RLS existente del tenant permanece. El adaptador no redefine políticas.

### Alineación de esquema (Infrastructure adapta al dominio)

El esquema legado no cubría todo el agregado Domain Done. La migración de Infrastructure Validation añade lo necesario **sin cambiar el dominio**:

| Columna / enum | Motivo |
|----------------|--------|
| `dish_status` + valor `inactive` | Dominio ya tiene `inactive` |
| `category_id` | Dominio exige `CategoryId` |
| `recipe_id` | Dominio permite `RecipeId` |
| `tags` | Dominio tiene etiquetas |

Soft delete de negocio sigue en `deleted_at` / `deleted_by` (alineado con `archivedAt` / `archivedBy`).

---

## Traducción Domain ↔ Persistence

| Dominio | Persistencia |
|---------|--------------|
| `DishId` | `id` |
| `TenantId` | `tenant_id` |
| `DishName` | `name` |
| `CategoryId` | `category_id` |
| `description` | `description` |
| `photoUrl` | `photo_url` |
| `PortionSize` (g) | `weight_g` |
| `NutritionFacts.calories` (kcal) | `kcal` |
| `Money` cost/price | `cost` / `price` |
| `allergens` | `allergens` |
| `tags` | `tags` |
| `RecipeId` | `recipe_id` |
| `DishStatus` | `status` (`draft` \| `active` \| `inactive` \| `archived`) |
| `archivedAt` / `archivedBy` | `deleted_at` / `deleted_by` |
| `createdAt` / `updatedAt` | `created_at` / `updated_at` |

### Qué no mapea al agregado (columnas legado)

`prep_minutes`, `prep_instructions`, `macros`: el adaptador **no** las interpreta como reglas. En `save` no las inventa; en lectura no las convierte en comportamiento de dominio. Pueden permanecer en fila para compatibilidad UI legado.

### Reconstitución

Siempre `Dish.reconstitute(...)` — nunca `Dish.create` al leer (no re-emitir `DishCreated`).

---

## Qué nunca hace

- Validar nombres, precios, transiciones o unicidad de negocio
- Comprobar RBAC / capabilities
- Conocer Use Cases, HTTP o React
- Sustituir `archive` por `purge`
- Decidir estados «por defecto» de negocio distintos del agregado persistido

---

## Errores

| Situación | Tratamiento |
|-----------|-------------|
| Fallo de red / PostgREST / Postgres | Propagar como error de infraestructura (no DomainError de negocio) |
| Fila no encontrada | `null` según contrato (`find*`) |
| Violación unique / FK inesperada | Propagar error de infraestructura (Application ya evitó duplicados de nombre) |

No traduce errores SQL a `DishNameRequired` ni similares.

---

## Definition of Done de esta especificación

- [x] Responde: contrato, tablas, mapeo, nunca, errores
- [x] `SupabaseDishRepository.ts`
- [x] Mapper Domain ↔ Row
- [x] Pruebas de infraestructura
- [x] Domain / Application intactos

---

## Siguiente paso

```text
SupabaseDishRepository.md   ✅
SupabaseDishRepository.ts   ✅
Infrastructure Tests        ✅
Infrastructure Validation   ✅
        ↓
Integration Validation (Supabase real)
```
