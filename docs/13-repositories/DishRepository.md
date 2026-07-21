# DishRepository — Contrato de dominio

**Agregado:** Dish  
**Módulo:** Dish Library (Module 01)  
**Estado del documento:** 🚧 Contrato modelado — pendiente de interface TypeScript  
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

## Operaciones del contrato (lenguaje ubicuo)

### Guardar

Persistir un `Dish` (alta o actualización del agregado completo según política de Application).

- Entrada: `Dish`
- Salida: void (o el mismo `Dish` si el dominio lo exige más adelante — por defecto void)

### Obtener por identidad

Recuperar un `Dish` por `DishId` dentro de la Organización.

- Entrada: `TenantId`, `DishId`
- Salida: `Dish | null`

### Comprobar existencia por nombre

Saber si ya existe un Dish con un `DishName` en la Organización (soporta la invariante de unicidad **fuera** de la entidad).

- Entrada: `TenantId`, `DishName`
- Salida: `boolean`

> La regla de unicidad vive en Domain / Application Service. El repositorio solo responde al hecho de existencia.

### Listar operativos / no archivados

Obtener los Dish de la Organización disponibles para flujos normales (no archivados), ordenados de forma estable por nombre.

- Entrada: `TenantId`
- Salida: `Dish[]`

### Buscar incluyendo archivados (por identidad)

Recuperar un Dish aunque esté archivado (necesario para `restore` y auditoría operativa).

- Entrada: `TenantId`, `DishId`
- Salida: `Dish | null`

### Purge (excepción)

Eliminar físicamente un Dish. Solo cuando Application lo ordene tras capabilities de SaaS Admin.

- Entrada: `TenantId`, `DishId`
- Salida: void

> No es la operación habitual. El dominio preferirá `archive`.

---

## Qué no incluye este contrato (aún)

Diferido conscientemente (no inventar por pantalla):

- Búsqueda full-text / filtros de UI (categoría, tags, precio) — se añadirán cuando un caso de uso de dominio lo exija.
- Paginación genérica de infraestructura — solo si el dominio/Application lo modela.
- «Eliminar» como sinónimo de archive — no existe; archive es operación de dominio sobre la entidad, luego `save`.

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
| | Abrir transacciones |
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
- [x] Alineado con REPOSITORY_GUIDELINES
- [x] Sin SQL ni proveedor
- [ ] Interface TypeScript `DishRepository.ts` (siguiente paso)
- [ ] Adaptador Supabase (posterior)
- [ ] Tests del adaptador / integración (posterior)

---

## Siguiente paso

```text
DishRepository.md     ✅ (este documento)
        ↓
DishRepository.ts     ⏳  interface del dominio
        ↓
Application Service
        ↓
SupabaseDishRepository
```
