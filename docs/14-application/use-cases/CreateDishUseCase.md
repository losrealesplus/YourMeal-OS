# CreateDishUseCase — Diseño UC-001

**Tipo:** especificación de implementación (no es estándar de Foundation)  
**Caso de uso:** [UC-001 — Crear Dish](../DISH_USE_CASES.md#uc-001--crear-dish)  
**Código previsto:** `src/modules/dish-library/application/create-dish-use-case.ts`  
**Estado:** listo para implementar

> Documento breve. Cuando esté implementado, el código es la traducción de este diseño.

---

## Objetivo

Registrar un nuevo plato para una Organización, en estado **draft**.

---

## Actor

Administrador (capability `dishes.create`).

---

## Responsabilidad

¿Qué coordina?

1. Autorización del actor.
2. Construcción de Value Objects a partir de la entrada.
3. Comprobación de unicidad de nombre en la Organización.
4. Creación del agregado (`Dish.create`).
5. Persistencia (`DishRepository.save`).
6. Auditoría y publicación del evento de dominio.
7. Devolución del **resultado de aplicación**.

No decide reglas de negocio. No conoce Supabase, HTTP ni React.

---

## Entradas

Entrada de aplicación (no DTO de UI, no body HTTP):

| Campo | Obligatorio | Notas |
|-------|-------------|--------|
| `name` | sí | → `DishName` |
| `categoryId` | sí | → `CategoryId` |
| `description` | no | |
| `photoUrl` | no | |
| `portionSize` | no | → `PortionSize` |
| `calories` / nutrición básica | no | → `NutritionFacts` / `Calories` |
| `price` | no | → `Money` |
| `cost` | no | → `Money` |
| `allergens` | no | |
| `tags` | no | |
| `recipeId` | no | → `RecipeId` (si se indica) |

El `tenantId` y el usuario salen del **contexto de aplicación** (`ServiceContext`), no del body de negocio.

Estado inicial: siempre **draft** (lo fija el dominio).

---

## Precondiciones

- Organización activa en el contexto.
- Usuario con `dishes.create`.
- Nombre válido y único en la Organización.
- Categoría indicada.

---

## Dependencias

Contratos — nada más:

| Dependencia | Obligatoria | Rol |
|-------------|-------------|-----|
| `DishRepository` | sí | `existsByName`, `save` |
| `ServiceContext` + `requireCapability` | sí | autorización / tenant / actor |
| Generador de id (`DishId`) | sí | identidad del nuevo plato |
| Reloj (`Clock`) | opcional | testabilidad de `createdAt` |
| Publicador de eventos | opcional v1 | si no hay bus aún: `pullDomainEvents()` tras `save` basta para tests |
| `AuditService` | sí (patrón Core) | auditoría de la operación |

No: Supabase client, React, HTTP, Prisma, UI DTOs.

---

## Flujo

```text
Input + ServiceContext
        ↓
requireCapability(dishes.create)
        ↓
Value Objects (DishName, CategoryId, Money, …)
        ↓
existsByName(tenantId, name)  →  si true: DishAlreadyExists
        ↓
DishId = generateId()
        ↓
Dish.create({ … })            →  estado draft + DishCreated en el agregado
        ↓
repository.save(dish)
        ↓
audit + publish(pullDomainEvents())
        ↓
CreateDishResult
```

---

## Resultado

Resultado de **aplicación**, no HTTP Response ni DTO de React.

Propuesta mínima:

```text
CreateDishResult {
  dishId: string
  tenantId: string
  name: string
  status: "draft"
}
```

Si hace falta más datos en un caller concreto, se amplía el resultado de aplicación — no se filtra un row de Supabase ni un componente.

---

## Eventos

- `DishCreated` (registrado por el dominio en `Dish.create`)

---

## Errores

| Error | Origen |
|-------|--------|
| `PERMISSION_DENIED` | Application (capability) |
| `DishNameRequired` / `DishNameTooLong` | Dominio (VO) |
| `DishCategoryRequired` | Dominio (si aplica) |
| `DishAlreadyExists` | Application (coordinación de unicidad) |

---

## Tests

`CreateDishUseCase.spec.ts` — con `DishRepository` en memoria (o fake):

1. Crea Dish en `draft` y persiste.
2. Rechaza nombre duplicado (`DishAlreadyExists`).
3. Rechaza sin capability.
4. Propaga errores de Value Object (nombre vacío / demasiado largo).
5. Emite / expone `DishCreated` tras éxito.

Sin Supabase. Sin React.

---

## Definition of Done de esta especificación

- [x] Cuatro preguntas respondidas (responsabilidad, dependencias, flujo, resultado)
- [ ] Código `CreateDishUseCase`
- [ ] Tests verdes
- [ ] Sin fachada monolítica obligatoria

---

## Siguiente paso

```text
CreateDishUseCase.md   ✅
        ↓
CreateDishUseCase.ts   ⏳
        ↓
CreateDishUseCase.spec.ts
```
