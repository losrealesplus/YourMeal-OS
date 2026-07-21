# Dish Application — Casos de uso

**Agregado:** Dish  
**Módulo:** Dish Library (Module 01)  
**Estado:** 🚧 Casos de uso modelados — Application Service pendiente  
**Código:** inglés · **Docs:** español

Estándar: [APPLICATION_GUIDELINES.md](./APPLICATION_GUIDELINES.md)  
Dominio: [Dish.md](../12-domain-model/module-01/Dish.md)  
Contrato: [DishRepository.md](../13-repositories/DishRepository.md)

---

## Pregunta guía

> **¿Qué operaciones necesita realmente una cocina (Organización) sobre un Dish?**

Si un caso de uso no puede describirse sin hablar de clases, servicios o bases de datos, **todavía no** pertenece a Application.

---

## Principio de claridad del caso de uso

> Cada caso de uso debe representar una acción que un usuario real pueda comprender y ejecutar. Si un caso de uso no puede describirse sin hablar de clases, servicios o bases de datos, todavía no pertenece a la capa de Aplicación.

---

## Actores habituales

| Actor | Rol en estos casos |
|-------|-------------------|
| **Administrador** / producción autorizada | Crear, actualizar, activar, desactivar, archivar, restaurar, duplicar, asignar Recipe |
| **Empleado** (cocina / producción con `dishes.read`) | Consultar catálogo (fuera del alcance de mutación de este documento) |
| **SaaS Administrator** | Purge excepcional (fuera del flujo habitual de cocina) |

Capabilities: ver [CAPABILITY_MATRIX.md](../09-security/CAPABILITY_MATRIX.md).

---

## Pensamiento en vertical slices

Aunque la primera implementación pueda agrupar coordinación en un `DishApplicationService`, **pensamos** cada operación como caso de uso separado:

| Caso de uso (negocio) | Nombre de slice (código futuro) |
|----------------------|----------------------------------|
| Crear Dish | `CreateDishUseCase` |
| Actualizar Dish | `UpdateDishUseCase` |
| Activar Dish | `ActivateDishUseCase` |
| Desactivar Dish | `DeactivateDishUseCase` |
| Archivar Dish | `ArchiveDishUseCase` |
| Restaurar Dish | `RestoreDishUseCase` |
| Duplicar Dish | `DuplicateDishUseCase` |
| Asignar Recipe | `AssignRecipeToDishUseCase` |

No empezamos por métodos genéricos `create()` / `update()` como identidad del diseño: empezamos por **acciones de cocina**.

---

## Caso de uso: Crear Dish

### Objetivo

Crear un nuevo plato en el catálogo de la Organización, en estado borrador, listo para completarse antes de ofrecerse.

### Quién

Usuario con capability `dishes.create`.

### Entradas (negocio)

- Nombre del plato
- Categoría
- Descripción (opcional)
- Foto (opcional)
- Porción / peso (opcional)
- Información nutricional básica (opcional)
- Coste (opcional; por defecto cero)
- Precio de venta (opcional; por defecto cero)
- Alérgenos (opcional)
- Etiquetas (opcional)

### Precondiciones

- Organización activa (tenant del contexto).
- Nombre válido (no vacío; longitud permitida).
- Categoría indicada.
- No existe otro plato con el mismo nombre en la Organización.

### Flujo de coordinación

1. Comprobar autorización (`dishes.create`).
2. Construir Value Objects a partir de las entradas (`DishName`, `CategoryId`, `Money`, …).
3. Comprobar unicidad de nombre vía repositorio (`existsByName`).
4. Crear el `Dish` en dominio (`Dish.create` → estado `draft`).
5. Guardar (`repository.save`).
6. Registrar auditoría.
7. Publicar eventos pendientes del agregado (`DishCreated`, …).
8. Devolver el plato creado.

### Resultado

Un Dish en **draft**, persistido, auditable.

### Errores esperados (negocio)

- Sin permiso.
- Nombre inválido / demasiado largo.
- Nombre duplicado en la Organización.
- Categoría ausente.

---

## Caso de uso: Actualizar Dish

### Objetivo

Modificar datos editables de un plato que aún no está archivado (nombre, precios, nutrición, etc.).

### Quién

Usuario con `dishes.update`.

### Entradas

- Identidad del plato
- Campos a modificar (parciales)

### Precondiciones

- El plato existe en la Organización.
- El plato **no** está archivado (si lo está: primero restaurar).
- Si cambia el nombre: sigue siendo único en la Organización.

### Flujo

1. Autorización (`dishes.update`).
2. Recuperar Dish (`findById` o `findByIdIncludingArchived` según política; normalmente no archivado).
3. Construir VOs de los campos nuevos.
4. Si hay rename: `existsByName` (excluyendo el propio id en Application).
5. `dish.update(...)`.
6. `save` · auditoría · eventos (`DishUpdated`).
7. Resultado.

### Resultado

Dish actualizado, no archivado.

---

## Caso de uso: Activar Dish

### Objetivo

Poner el plato a disposición de planificación, producción, pedidos y menús.

### Quién

Usuario con capability de activación (alineada a `dishes.update` / futura `dishes.activate` en matriz).

### Precondiciones

- El plato existe y no está archivado.
- Cumple invariantes de activación del dominio (p. ej. categoría).
- Transición de estado permitida (`draft` o `inactive` → `active`).

### Flujo

1. Autorización.
2. Recuperar Dish.
3. `dish.activate()`.
4. `save` · auditoría · `DishActivated`.
5. Resultado.

### Resultado

Dish **active** (operativo).

### Nota

La obligatoriedad de Recipe válida al activar permanece **diferida** hasta el dominio Recipe (hueco ya documentado en Domain Done).

---

## Caso de uso: Desactivar Dish

### Objetivo

Retirar el plato de nuevas operaciones sin borrarlo ni perder historial.

### Quién

Usuario autorizado a desactivar.

### Precondiciones

- El plato está `active` (única transición válida hacia `inactive`).

### Flujo

1. Autorización.
2. Recuperar Dish.
3. `dish.deactivate()`.
4. `save` · auditoría · `DishDeactivated`.
5. Resultado.

### Resultado

Dish **inactive**.

---

## Caso de uso: Archivar Dish

### Objetivo

Retirar el plato del catálogo operativo (soft delete de negocio), conservando historial y relaciones.

### Quién

Usuario con `dishes.archive`.

### Precondiciones

- El plato existe y no está ya archivado.

### Flujo

1. Autorización (`dishes.archive`).
2. Recuperar Dish.
3. `dish.archive(usuario)`.
4. `save` · auditoría · `DishArchived`.
5. Resultado.

### Resultado

Dish **archived**. No aparece en listados operativos.

### Importante

Archive **no** es purge. Purge es caso excepcional (SaaS Admin), no flujo de cocina.

---

## Caso de uso: Restaurar Dish

### Objetivo

Devolver un plato archivado al catálogo (por defecto a **draft**; opcionalmente a **inactive**).

### Quién

Usuario con `dishes.restore`.

### Precondiciones

- El plato existe y está archivado.

### Flujo

1. Autorización (`dishes.restore`).
2. Recuperar con `findByIdIncludingArchived`.
3. `dish.restore(target)`.
4. `save` · auditoría · `DishRestored`.
5. Resultado.

### Resultado

Dish en `draft` o `inactive`, sin marca de archivo.

---

## Caso de uso: Duplicar Dish

### Objetivo

Crear un nuevo plato en la misma Organización a partir de uno existente, como borrador (p. ej. variante o copia de trabajo).

### Quién

Usuario con `dishes.create` (y lectura del origen).

### Entradas

- Identidad del plato origen
- Nombre del nuevo plato (opcional; por defecto el mismo nombre sujeto a unicidad — Application puede exigir nombre distinto)

### Precondiciones

- El plato origen existe.
- El nombre del nuevo plato es único en la Organización.

### Flujo

1. Autorización.
2. Recuperar origen.
3. Comprobar unicidad del nombre destino.
4. `origen.duplicate(newId, name)` → nuevo Dish en `draft`.
5. `save` del nuevo · auditoría · eventos (`DishCreated`, `DishDuplicated`).
6. Resultado (nuevo Dish).

### Resultado

Nuevo Dish independiente en **draft**.

---

## Caso de uso: Asignar Recipe

### Objetivo

Asociar una Recipe al Dish (composición). La validez profunda de la Recipe pertenece al módulo Recipe.

### Quién

Usuario autorizado a actualizar el plato / recipes.

### Precondiciones

- Dish existe y no está archivado.
- RecipeId indicado (la existencia/validez de Recipe se reforzará cuando exista ese agregado).

### Flujo

1. Autorización.
2. Recuperar Dish.
3. `dish.assignRecipe(recipeId)`.
4. `save` · auditoría · `RecipeAssigned`.
5. Resultado.

### Resultado

Dish con Recipe asociada.

---

## Caso de uso deliberadamente fuera del MVP de cocina

### Purge Dish

Borrado físico excepcional (SaaS Admin: `dishes.purge` + `records.purge`).

No forma parte del trabajo diario de una cocina. Se documentará en Application solo como operación de plataforma, no como caso de uso de catálogo operativo.

---

## Qué coordina Application (resumen)

| Paso típico | Dónde |
|-------------|--------|
| ¿Puede este usuario? | Application (RBAC) |
| ¿Nombre único? | Application + `existsByName` |
| ¿Estado válido / invariantes? | Dominio (`Dish`, VOs) |
| ¿Persistir? | Repository |
| ¿Quién lo hizo? | Application (auditoría) |
| ¿Qué ocurrió? | Domain Events (publicados desde Application) |

---

## Qué no hace Application

- Validar longitud del nombre (→ `DishName`).
- Decidir si `draft` puede pasar a `inactive` (→ `DishStatus`).
- Escribir SQL / hablar con Supabase.
- Devolver HTTP o componentes React.

---

## Definition of Done de este documento

- [x] Casos de uso en lenguaje de cocina / Organización
- [x] Precondiciones y flujos de coordinación
- [x] Vertical slices nombrados
- [x] Separación archive vs purge
- [ ] `DishApplicationService` / use cases en código
- [ ] Tests de aplicación
- [ ] Adaptador Supabase

---

## Siguiente paso

```text
DishApplication.md              ✅ (este documento)
        ↓
DishApplicationService.ts       ⏳  (slices / casos de uso)
        ↓
Application Tests
        ↓
SupabaseDishRepository
        ↓
UI MVP
```
