# DISH_USE_CASES — Casos de uso del agregado Dish

## Propósito

Este documento define **todos los casos de uso** relacionados con el agregado Dish.

Describe qué acciones puede realizar el negocio sobre un plato y cómo deben coordinarse desde la capa de Aplicación.

No contiene detalles de infraestructura ni implementación.

Los casos de uso representan **operaciones del negocio**, no métodos de programación.

**Código:** inglés · **Docs:** español (ADR 0010)

| Relacionado | Documento |
|-------------|-----------|
| Dominio | [Dish.md](../12-domain-model/module-01/Dish.md) |
| Application | [APPLICATION_GUIDELINES.md](./APPLICATION_GUIDELINES.md) |
| Repository | [DishRepository.md](../13-repositories/DishRepository.md) |
| Borrador previo | [DishApplication.md](./DishApplication.md) *(superseded por este documento)* |

---

## Principios

- Cada caso de uso representa una acción comprensible para un usuario.
- Cada caso de uso tiene un único objetivo.
- Las reglas pertenecen al dominio.
- Application únicamente coordina.
- Los Repositories solo recuperan y persisten.
- Ningún caso de uso conoce Supabase, HTTP o React.
- La unidad de diseño en código será **un caso de uso por clase** (`CreateDishUseCase`, …), no un método genérico en un servicio monolítico.
- Una fachada `DishApplicationService` es opcional y posterior; no es la unidad de diseño.

### Use Case Clarity

> Cada caso de uso debe representar una acción que un usuario real pueda comprender y ejecutar. Si no puede describirse sin hablar de clases, servicios o bases de datos, todavía no pertenece a Application.

---

## Índice

| ID | Caso de uso | Slice (código futuro) |
|----|-------------|------------------------|
| UC-001 | Crear Dish | `CreateDishUseCase` |
| UC-002 | Actualizar Dish | `UpdateDishUseCase` |
| UC-003 | Activar Dish | `ActivateDishUseCase` |
| UC-004 | Desactivar Dish | `DeactivateDishUseCase` |
| UC-005 | Archivar Dish | `ArchiveDishUseCase` |
| UC-006 | Restaurar Dish | `RestoreDishUseCase` |
| UC-007 | Duplicar Dish | `DuplicateDishUseCase` |
| UC-008 | Asignar Recipe | `AssignRecipeToDishUseCase` |

Fuera del catálogo operativo de cocina: **Purge Dish** (plataforma / SaaS Admin) — no es UC de este documento.

---

## UC-001 — Crear Dish

### Objetivo

Registrar un nuevo plato para una Organización, en estado borrador, listo para completarse antes de ofrecerse.

### Actor

Administrador (o rol con `dishes.create`).

### Entradas

- Organización (`TenantId` / OrganizationId)
- Nombre
- Categoría
- Precio (opcional)
- Coste (opcional)
- Porción (opcional)
- Calorías / nutrición básica (opcional)
- Descripción, foto, alérgenos, etiquetas (opcionales)
- Estado inicial: siempre **draft** (el dominio lo fija al crear)

### Precondiciones

- Organización existente (contexto activo)
- Nombre válido
- Nombre único en la Organización
- Categoría indicada
- Usuario autorizado (`dishes.create`)

### Flujo principal

1. Comprobar autorización.
2. Construir Value Objects.
3. Verificar unicidad de nombre (`existsByName`).
4. Crear Dish en dominio (`draft`).
5. Persistir mediante Repository (`save`).
6. Registrar auditoría.
7. Publicar evento correspondiente.
8. Devolver el resultado.

### Resultado esperado

Nuevo Dish registrado en **draft**.

### Eventos

- `DishCreated`

### Errores

- `DishNameRequired`
- `DishNameTooLong`
- `DishCategoryRequired` (si aplica)
- `DishAlreadyExists` *(unicidad — Application / error de coordinación)*
- `PERMISSION_DENIED`

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `CreateDishUseCase` |
| Eventos | `DishCreated` |
| Tests | `CreateDishUseCase.spec.ts` |

**Diseño de implementación:** [CreateDishUseCase.md](./use-cases/CreateDishUseCase.md)

---

## UC-002 — Actualizar Dish

### Objetivo

Modificar datos editables de un plato que forma parte del catálogo (sin archivarlo).

### Actor

Administrador / producción autorizada (`dishes.update`).

### Entradas

- Organización
- Identidad del plato
- Campos a modificar (nombre, precio, porción, nutrición, descripción, etc.)

### Precondiciones

- El plato existe en la Organización
- El plato no está archivado
- Si cambia el nombre: sigue siendo único
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish (`findById`).
3. Construir Value Objects de los campos nuevos.
4. Si hay rename: verificar unicidad.
5. Actualizar en dominio.
6. Persistir (`save`).
7. Auditoría · publicar eventos.
8. Devolver el resultado.

### Resultado esperado

Dish actualizado.

### Eventos

- `DishUpdated`

### Errores

- `DISH_NOT_FOUND` / no encontrado
- `DishCannotModifyWhenArchived`
- `DishNameRequired` / `DishNameTooLong`
- `DishAlreadyExists`
- `PERMISSION_DENIED`

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `UpdateDishUseCase` |
| Eventos | `DishUpdated` |
| Tests | `UpdateDishUseCase.spec.ts` |

---

## UC-003 — Activar Dish

### Objetivo

Poner el plato a disposición de planificación, producción, pedidos y menús.

### Actor

Administrador / producción autorizada.

### Entradas

- Organización
- Identidad del plato

### Precondiciones

- El plato existe y no está archivado
- Transición de estado permitida (`draft` o `inactive` → `active`)
- Invariantes de activación del dominio satisfechas
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish.
3. Activar en dominio.
4. Persistir.
5. Auditoría · publicar eventos.
6. Devolver el resultado.

### Resultado esperado

Dish **active** (operativo).

### Eventos

- `DishActivated`

### Errores

- No encontrado
- `InvalidDishState`
- `DishCategoryRequired` (si aplica al activar)
- `PERMISSION_DENIED`

### Nota

Obligatoriedad de Recipe válida al activar: **diferida** hasta dominio Recipe.

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `ActivateDishUseCase` |
| Eventos | `DishActivated` |
| Tests | `ActivateDishUseCase.spec.ts` |

---

## UC-004 — Desactivar Dish

### Objetivo

Retirar el plato de nuevas operaciones sin borrarlo ni perder historial.

### Actor

Administrador / producción autorizada.

### Entradas

- Organización
- Identidad del plato

### Precondiciones

- El plato está **active** (única transición válida hacia `inactive`)
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish.
3. Desactivar en dominio.
4. Persistir.
5. Auditoría · publicar eventos.
6. Devolver el resultado.

### Resultado esperado

Dish **inactive**.

### Eventos

- `DishDeactivated`

### Errores

- No encontrado
- `InvalidDishState`
- `PERMISSION_DENIED`

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `DeactivateDishUseCase` |
| Eventos | `DishDeactivated` |
| Tests | `DeactivateDishUseCase.spec.ts` |

---

## UC-005 — Archivar Dish

### Objetivo

Retirar el plato del catálogo operativo (soft delete de negocio), conservando historial y relaciones.

### Actor

Administrador (`dishes.archive`).

### Entradas

- Organización
- Identidad del plato
- Quién archiva (usuario del contexto)

### Precondiciones

- El plato existe y no está ya archivado
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish.
3. Archivar en dominio.
4. Persistir (`save` — no `purge`).
5. Auditoría · publicar eventos.
6. Devolver el resultado.

### Resultado esperado

Dish **archived**. No aparece en listados operativos.

### Eventos

- `DishArchived`

### Errores

- No encontrado
- `DishAlreadyArchived`
- `InvalidDishState`
- `PERMISSION_DENIED`

### Importante

Archivar **no** es purge. Purge no es un caso de uso de cocina.

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `ArchiveDishUseCase` |
| Eventos | `DishArchived` |
| Tests | `ArchiveDishUseCase.spec.ts` |

---

## UC-006 — Restaurar Dish

### Objetivo

Devolver un plato archivado al catálogo (por defecto a **draft**).

### Actor

Administrador (`dishes.restore`).

### Entradas

- Organización
- Identidad del plato
- Destino opcional: `draft` (default) o `inactive`

### Precondiciones

- El plato existe y está archivado
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish incluyendo archivados.
3. Restaurar en dominio.
4. Persistir.
5. Auditoría · publicar eventos.
6. Devolver el resultado.

### Resultado esperado

Dish en `draft` o `inactive`, sin marca de archivo.

### Eventos

- `DishRestored`

### Errores

- No encontrado
- `DishNotArchived`
- `InvalidDishState`
- `PERMISSION_DENIED`

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `RestoreDishUseCase` |
| Eventos | `DishRestored` |
| Tests | `RestoreDishUseCase.spec.ts` |

---

## UC-007 — Duplicar Dish

### Objetivo

Crear un nuevo plato en la misma Organización a partir de uno existente, como borrador de trabajo o variante.

### Actor

Administrador (`dishes.create` + lectura del origen).

### Entradas

- Organización
- Identidad del plato origen
- Nombre del nuevo plato (recomendado distinto; sujeto a unicidad)

### Precondiciones

- El plato origen existe
- El nombre destino es único
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar plato origen.
3. Verificar unicidad del nombre destino.
4. Duplicar en dominio (nuevo id, estado `draft`).
5. Persistir el nuevo Dish.
6. Auditoría · publicar eventos.
7. Devolver el nuevo Dish.

### Resultado esperado

Nuevo Dish independiente en **draft**.

### Eventos

- `DishCreated`
- `DishDuplicated`

### Errores

- Origen no encontrado
- `DishAlreadyExists`
- Errores de nombre
- `PERMISSION_DENIED`

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `DuplicateDishUseCase` |
| Eventos | `DishCreated`, `DishDuplicated` |
| Tests | `DuplicateDishUseCase.spec.ts` |

---

## UC-008 — Asignar Recipe

### Objetivo

Asociar una Recipe al plato (composición). La validación profunda de la Recipe pertenece al módulo Recipe.

### Actor

Administrador / producción autorizada.

### Entradas

- Organización
- Identidad del plato
- Identidad de la Recipe

### Precondiciones

- El plato existe y no está archivado
- RecipeId indicado
- Usuario autorizado

### Flujo principal

1. Comprobar autorización.
2. Recuperar Dish.
3. Asignar Recipe en dominio.
4. Persistir.
5. Auditoría · publicar eventos.
6. Devolver el resultado.

### Resultado esperado

Dish con Recipe asociada.

### Eventos

- `RecipeAssigned`

### Errores

- Dish no encontrado / archivado
- `DishCannotModifyWhenArchived`
- `PERMISSION_DENIED`
- *(futuro)* Recipe no válida / no encontrada

### Implementación (trazabilidad)

| Capa | Elemento |
|------|----------|
| Entity | `Dish` |
| Repository | `DishRepository` |
| Application | `AssignRecipeToDishUseCase` |
| Eventos | `RecipeAssigned` |
| Tests | `AssignRecipeToDishUseCase.spec.ts` |

---

## Trazabilidad del sistema

Cadena de lectura para cualquier desarrollador:

```text
Caso de uso (este documento)
        ↓
Dominio (Dish.md / Dish.ts)
        ↓
Persistencia (DishRepository.md / DishRepository.ts)
        ↓
Implementación (CreateDishUseCase, …)
        ↓
Pruebas (*.spec.ts)
```

> Cada decisión nace en el negocio, se documenta, se implementa y se valida.

---

## Flujo metodológico completo

```text
FOUNDATION
        ↓
ENTITY_GUIDELINES
        ↓
REPOSITORY_GUIDELINES
        ↓
APPLICATION_GUIDELINES
        ↓
Dish.md
        ↓
DISH_USE_CASES.md          ← este documento
        ↓
CreateDishUseCase.ts …
        ↓
(DishApplicationService fachada — opcional)
        ↓
Application Tests
        ↓
SupabaseDishRepository
```

El código **no** es el lugar donde se toman decisiones.

---

## Definition of Done de este documento

- [x] Todos los UC de catálogo operativo definidos
- [x] Lenguaje de negocio (sin clases en la narrativa)
- [x] Trazabilidad por UC
- [x] Un UC = una unidad de diseño futura
- [x] Implementación de CreateDishUseCase (UC-001)
- [x] Resto de Use Cases en código (UC-002…UC-008)
- [x] Tests de Application
- [ ] Fachada opcional
- [ ] SupabaseDishRepository

---

## Siguiente paso

```text
DISH_USE_CASES.md          ✅
CreateDishUseCase … UC-008 ✅
        ↓
SupabaseDishRepository     ⏳
        ↓
UI MVP
```
