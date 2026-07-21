# UC-001 — Create Dish

**Pregunta de prueba:** *¿Qué hace CreateDishUseCase?*  
Si la respuesta exige abrir el código, este documento ha fallado.  
Si basta con leerlo, es un contrato entre Producto y Desarrollo.

**Catálogo:** [DISH_USE_CASES · UC-001](../DISH_USE_CASES.md#uc-001--crear-dish)  
**Código (traducción):** `src/modules/dish-library/application/create-dish-use-case.ts`

---

## 1. Propósito

Registrar un nuevo plato para una organización garantizando que cumple las reglas del dominio antes de quedar disponible para el resto del sistema.

---

## 2. Actor

**Administrador de la Organización** (o rol con responsabilidad de catálogo de platos).

No es «quien pulsa el botón».  
Es quien tiene la **responsabilidad de negocio** de incorporar un plato al catálogo.

Capability de autorización: `dishes.create`.

---

## 3. Trigger

Cualquier origen que deba crear un plato ejecuta **exactamente este** caso de uso:

- Un administrador crea un plato en la aplicación.
- Una importación masiva de catálogo.
- Una IA propone un nuevo menú y materializa platos.

La UI, el batch o la IA no inventan otra forma de crear. Orquestan este caso de uso.

---

## 4. Entradas

Conceptos del negocio — no DTOs de UI ni bodies HTTP.

**Obligatorias**

| Concepto | Significado |
|----------|-------------|
| OrganizationId | Organización dueña del plato |
| ActorId | Quién inicia la operación (auditoría / contexto) |
| Roles del actor | Para comprobar `dishes.create` |
| DishName | Nombre del plato |
| CategoryId | Categoría del plato |

**Opcionales**

| Concepto | Significado |
|----------|-------------|
| Description | Texto descriptivo |
| PhotoUrl | Referencia a imagen |
| Portion | Tamaño de porción (gramos) |
| Calories | Energía (kcal) |
| Price | Precio de venta |
| Cost | Coste |
| Allergens | Lista de alérgenos |
| Tags | Etiquetas |
| RecipeId | Recipe asociada, si ya existe |

El estado inicial **no** es entrada: el dominio lo fija siempre en **draft**.

---

## 5. Dependencias

Solo contratos. Nada tecnológico.

| Contrato | Para qué |
|----------|----------|
| DishRepository | Comprobar unicidad del nombre y persistir el agregado |
| EventPublisher | Publicar los hechos de dominio tras persistir con éxito |
| IdGenerator | Generar la identidad del nuevo plato |
| Clock | Momento de creación (testable; puede ser el reloj del sistema) |

No conoce: Supabase, HTTP, React, PostgreSQL, formularios.

La autorización usa las capabilities del Core (`dishes.create`) — no es un adaptador de infraestructura.

---

## 6. Flujo

Comportamiento — sin pseudocódigo ni TypeScript.

```text
Autorizar al actor (dishes.create)
        ↓
Construir Value Objects desde las entradas
        ↓
Verificar unicidad del nombre en la Organización
        ↓
Generar identidad del plato
        ↓
Crear Dish en dominio (estado draft)
        ↓
Persistir mediante DishRepository
        ↓
Publicar eventos del agregado (DishCreated)
        ↓
Construir resultado de aplicación
```

Si la unicidad falla → error de negocio `DishAlreadyExists` (no se crea nada).  
Si un Value Object es inválido → error del dominio (no se persiste nada).  
Si falla la persistencia → no se publica el evento como hecho consumado.

Nunca queda un Dish «a medias» visible para el resto del sistema.

---

## 7. Resultado

No Response HTTP. No JSON de framework. No modelo de React.

Un **resultado de aplicación** que confirma el hecho de negocio:

```text
Dish creado correctamente.
Identidad generada (DishId).
Organización (OrganizationId).
Nombre registrado.
Estado inicial: draft.
```

Con eso el caller puede continuar (mostrar confirmación, navegar al plato, encadenar otro caso de uso).

---

## 8. Errores

Solo errores posibles de negocio / coordinación. No excepciones técnicas de red o SQL.

| Error | Cuándo |
|-------|--------|
| Sin permiso (`PERMISSION_DENIED`) | El actor no puede crear platos |
| `DishNameRequired` | Nombre vacío o ausente |
| `DishNameTooLong` | Nombre fuera del límite del dominio |
| `DishCategoryRequired` / categoría inválida | Falta categoría válida |
| `DishAlreadyExists` | Ya hay un plato con ese nombre en la Organización |
| Errores de Value Object (precio, porción, calorías, …) | Entrada opcional inválida |

---

## 9. Eventos

```text
DishCreated
```

Y nada más en este caso de uso.

---

## 10. Invariantes

¿Qué debe seguir siendo cierto cuando termina este caso de uso?

- El nombre del nuevo plato es **único** dentro de la Organización.
- El Dish creado cumple **todas las invariantes del agregado** (VOs válidos, estado `draft`).
- **No existe** un Dish parcialmente creado: o el caso de uso completa persistencia + evento, o no deja rastro operativo.
- El plato **no** queda operativo (`active`) solo por crearse: hace falta otro caso de uso (Activar).
- Ninguna regla de negocio nueva se ha aplicado fuera del dominio.

---

## 11. Definition of Done

Un caso de uso está terminado cuando **cualquier desarrollador puede implementarlo correctamente leyendo únicamente esta especificación**.

Concretamente:

- [x] Todos los Value Objects se crean correctamente (o fallan con el error de dominio esperado).
- [x] Solo usa contratos del dominio / Application (`DishRepository`, `EventPublisher`, `IdGenerator`, `Clock`).
- [x] No conoce infraestructura (Supabase, HTTP, React).
- [x] Publica el evento `DishCreated` tras éxito.
- [x] Tiene pruebas que cubren éxito, duplicado, sin permiso y nombre inválido.
- [x] Cumple el flujo documentado aquí.
- [x] El resultado es de aplicación, no de transporte.

---

## Principio

> Un caso de uso está terminado cuando cualquier desarrollador puede implementarlo correctamente leyendo únicamente su especificación.

La decisión nace en el negocio, se formaliza aquí, se traduce a código y se valida con pruebas.
