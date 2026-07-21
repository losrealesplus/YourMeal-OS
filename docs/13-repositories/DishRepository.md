# DishRepository — Contrato de dominio

**Agregado:** Dish  
**Módulo:** Dish Library (Module 01)  
**Estado del documento:** ✅ Contrato tipado — `DishRepository.ts` existe; adaptador pendiente  
**Código:** inglés · **Docs:** español

Estándar: [REPOSITORY_GUIDELINES.md](./REPOSITORY_GUIDELINES.md)  
Dominio: [Dish.md](../12-domain-model/module-01/Dish.md) · [DOMAIN_DONE.md](../12-domain-model/DOMAIN_DONE.md)

---

## Propósito

Definir **qué necesita el dominio de Dish** para recuperar y persistir el agregado.

No define consultas SQL.

No define tablas.

No define Supabase.

---

## Pregunta guía

> ¿Qué necesita el dominio de Dish para funcionar?

---

## Patrón vs específico

| Origen | Operaciones en este contrato |
|--------|------------------------------|
| **Común (patrón Core)** | `save`, `findById`, `listNotArchived`, `findByIdIncludingArchived`, `purge` (excepción) |
| **Específico de Dish** | `existsByName` |

---

## Checklist previo al TypeScript

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué necesita el dominio? | Persistir Dish; recuperar por id; unicidad de nombre; listar no archivados; recuperar archivados para restore; purge excepcional |
| ¿Qué nunca hará el repositorio? | Validar negocio, RBAC, transiciones, transacciones, SQL, DTOs |
| ¿Qué devuelve cada operación? | Ver tabla de operaciones |
| ¿Qué errores puede producir? | Fallos de infraestructura (propagados por la implementación). El contrato de dominio no define Domain Errors de negocio — esos viven en entidad / Application |
| ¿Qué es obligatorio para este agregado? | Las operaciones listadas abajo |
| ¿Qué pertenece a otros niveles? | Archive/restore (dominio); autorización purge (Application); mapping filas (Infrastructure) |

---

## Operaciones del contrato

### `save` — Guardar *(común)*

Persistir un `Dish` (alta o actualización del agregado).

| | |
|--|--|
| Entrada | `Dish` |
| Salida | `Promise<void>` |
| Errores | Fallos de persistencia (infra). No valida invariantes del Dish. |
| Notas | Tras `archive` / `restore` / `activate` en dominio, Application llama `save`. |

### `findById` — Obtener por identidad *(común)*

Recuperar un `Dish` no archivado por `DishId` dentro de la Organización.

| | |
|--|--|
| Entrada | `TenantId`, `DishId` |
| Salida | `Promise<Dish \| null>` |
| Errores | Infra. `null` = no encontrado o archivado (según política de listado activo). |

### `existsByName` — Existencia por nombre *(específico Dish)*

¿Existe ya un Dish con ese `DishName` en la Organización?

| | |
|--|--|
| Entrada | `TenantId`, `DishName` |
| Salida | `Promise<boolean>` |
| Errores | Infra. |
| Notas | La **regla** de unicidad la aplica Application/Domain Service. El repo solo responde el hecho. |

### `listNotArchived` — Listar no archivados *(común)*

Dish de la Organización disponibles para flujos normales, orden estable por nombre.

| | |
|--|--|
| Entrada | `TenantId` |
| Salida | `Promise<Dish[]>` |
| Errores | Infra. Lista vacía si no hay resultados. |

### `findByIdIncludingArchived` — Incluyendo archivados *(común)*

Necesario para `restore` y operaciones sobre historial.

| | |
|--|--|
| Entrada | `TenantId`, `DishId` |
| Salida | `Promise<Dish \| null>` |
| Errores | Infra. |

### `purge` — Borrado físico *(común como excepción; no habitual)*

Eliminar físicamente un Dish.

| | |
|--|--|
| Entrada | `TenantId`, `DishId` |
| Salida | `Promise<void>` |
| Errores | Infra. Application debe haber comprobado capabilities (SaaS Admin). |
| **Prohibido** | Usar como sustituto de `archive`. Archive = dominio + `save`. |

---

## Qué no incluye este contrato (aún)

- Filtros de UI (categoría, tags, precio, full-text).
- Paginación genérica de infraestructura.
- Método `delete` / `archive` en el repositorio — archive es del dominio.

---

## Entradas y salidas

| Concepto | Tipo de dominio |
|----------|-----------------|
| Identidad | `DishId` |
| Organización | `TenantId` |
| Nombre | `DishName` |
| Agregado | `Dish` |

Nunca: DTO, JSON, `Tables<"dishes">`, filas SQL.

---

## Responsabilidades

| Sí | No |
|----|----|
| Persistir / reconstituir `Dish` | Validar `DishName`, precios, etc. |
| Responder existencia por nombre | Decidir activate / archive |
| Filtrar por tenant | Comprobar RBAC |
| Ejecutar `purge` cuando Application lo ordene | Abrir transacciones |
| | Conocer Supabase |

---

## Implementaciones previstas (Infrastructure)

| Nombre | Uso |
|--------|-----|
| `SupabaseDishRepository` | Producción |
| `MemoryDishRepository` / `FakeDishRepository` | Tests |

El contrato se llamará siempre `DishRepository`.

---

## Definition of Done de este documento

- [x] Necesidades del dominio expresadas en lenguaje ubicuo
- [x] Patrón común vs operaciones específicas documentado
- [x] Archive vs purge clarificado
- [x] Alineado con REPOSITORY_GUIDELINES
- [x] Sin SQL ni proveedor
- [x] Checklist previo al TS respondido
- [x] Interface TypeScript `DishRepository.ts`
- [ ] Adaptador Supabase (posterior)

---

## Siguiente paso

```text
DishRepository.md     ✅
        ↓
DishRepository.ts     ✅
        ↓
Application Layer Guidelines
        ↓
DishApplicationService
        ↓
Use Cases
        ↓
SupabaseDishRepository
```
