# Repository Guidelines — Estándar de repositorios del Core

**Estándar oficial** para modelar repositorios dentro del Core de YourMeal OS.

Su objetivo es garantizar que todos los repositorios compartan la misma filosofía, responsabilidades y límites.

Un Repository **no** es un acceso a base de datos.

Es el **contrato del dominio** para recuperar y persistir agregados.

**Código:** inglés · **Docs:** español (ADR 0010)

Relacionado: [`FOUNDATION.md`](../../FOUNDATION.md) · [ENTITY_GUIDELINES.md](../12-domain-model/ENTITY_GUIDELINES.md) · [DOMAIN_DONE.md](../12-domain-model/DOMAIN_DONE.md)

---

## Propósito

¿Qué problema resuelve un Repository?

Permite que el dominio **recupere y persista agregados** sin acoplarse a ninguna tecnología de almacenamiento.

El dominio habla con un contrato.

La infraestructura implementa ese contrato.

Nunca al revés.

---

## Filosofía

```text
FOUNDATION
        ↓
REPOSITORY_GUIDELINES
        ↓
<Aggregate>Repository.md
        ↓
<Aggregate>Repository.ts   (contrato)
        ↓
Supabase… / Memory… / Fake…  (implementaciones)
```

La misma disciplina que las entidades:

```text
ENTITY_GUIDELINES → Dish.md → Dish.ts
REPOSITORY_GUIDELINES → DishRepository.md → DishRepository.ts
```

El contrato se **modela** antes de implementarse.

---

## Repository Minimalism

> Un Repository existe únicamente para permitir que el dominio recupere y persista agregados. No implementa reglas de negocio, no interpreta datos y no coordina procesos. Cuanto más pequeño sea su contrato, mayor será la independencia del Core.

---

## Repository Contract Pattern

Antes de tipar un repositorio concreto, distinguir:

### Operaciones comunes (patrón implícito del Core)

La mayoría de agregados compartirán, en espíritu, operaciones como:

| Operación (ubicua) | Intención |
|--------------------|-----------|
| `save` | Persistir el agregado |
| `findById` | Recuperar por identidad (ámbito Organización) |
| `exists…` | Comprobar existencia cuando el dominio lo necesite |
| `listNotArchived` / equivalente | Listar no archivados para flujos normales |
| `findByIdIncludingArchived` | Recuperar también archivados (restore / trazabilidad) |

Esto es un **contrato común implícito**: una guía de consistencia entre módulos.

### Operaciones específicas del agregado

Cada repositorio añade **solo** lo que su dominio exige. Ejemplos:

- `existsByName(tenant, DishName)` → Dish
- `findByRecipe(...)` → quizá Recipe
- `findPendingProduction(...)` → Production

### Qué no hacemos (aún)

No introducir una interfaz base obligatoria del tipo:

```text
BaseRepository<T>
```

ni genéricos «por si acaso».

Si en el futuro un genérico aporta valor real medible, se justificará con ADR. Hasta entonces: **patrón documentado, contratos explícitos por agregado**.

---

## Archive vs Purge

| Concepto | Dónde vive | Qué es |
|----------|------------|--------|
| **Archive** | **Dominio** (`dish.archive()` + luego `save`) | Soft delete / retiro de negocio. Operación habitual. |
| **Restore** | **Dominio** (`dish.restore()` + luego `save`) | Reversión del archive. |
| **Purge** | **Contrato de repositorio + Application** | Borrado físico excepcional (cumplimiento, limpieza controlada, SaaS Admin). |

Reglas:

- Nadie debe usar `purge` como sustituto de `archive`.
- El repositorio **no** decide archivar: persiste el estado que el dominio ya cambió, o ejecuta `purge` solo cuando Application lo ordena tras autorización.
- Si un contrato incluye `purge`, debe etiquetarse explícitamente como **excepción**.

---

## Responsabilidades

### Qué puede hacer

- Guardar un agregado (`save` / upsert de dominio).
- Recuperar un agregado por identidad.
- Preguntar existencia cuando el dominio lo necesite (p. ej. unicidad).
- Listar o buscar agregados según **criterios del dominio** (no SQL).
- Devolver entidades (o colecciones de entidades) reconstruidas.

### Qué nunca debe hacer

- Validar reglas de negocio.
- Ejecutar transiciones de estado.
- Decidir autorización / permisos / RBAC.
- Abrir o gestionar transacciones.
- Emitir Domain Events (eso lo hace el dominio / Application).
- Conocer UI, HTTP, DTOs o ViewModels.
- Contener SQL, nombres de tablas o detalles de proveedor.

---

## Qué conoce

Conoce:

- Entidades
- Value Objects
- IDs del dominio
- Specifications (si existen en el dominio)

### No conoce

- SQL
- Supabase
- Prisma
- Drizzle
- PostgreSQL
- REST
- GraphQL
- JSON de transporte
- frameworks de UI

---

## Qué devuelve

Nunca DTO.

Nunca JSON.

Nunca filas de base de datos.

Siempre:

```text
Entity
```

o, cuando el dominio lo justifique explícitamente:

```text
Value Object
```

o `null` / colección vacía cuando no hay resultado.

---

## Qué no valida

No valida reglas de negocio.

Eso pertenece al **dominio** (entidad, VOs, Domain Services).

El repositorio asume que el agregado que recibe ya es válido según el dominio, o se limita a materializar/reconstituir.

---

## Qué no decide

No decide:

- autorización;
- permisos;
- estados;
- transiciones;
- políticas de Feature Flags;
- si un Soft Delete es «purge» o «archive» a nivel de negocio (eso lo decide el dominio / Application; el repo solo persiste el resultado).

---

## Transacciones

No abre transacciones.

La unidad de trabajo / transacción pertenece a **Application** o **Infrastructure**, según el diseño del caso de uso.

---

## Nombre

El **contrato** del dominio siempre lleva el nombre del agregado:

```text
DishRepository
IngredientRepository
OrderRepository
```

Incorrecto en el contrato:

```text
DatabaseRepository
SupabaseRepository
PostgresDishRepository
```

### Implementaciones (Infrastructure)

```text
SupabaseDishRepository
MemoryDishRepository
FakeDishRepository
```

El Core depende del contrato.

La infraestructura depende del Core.

---

## Soft Delete y persistencia

Ver sección **Archive vs Purge** más arriba.

Resumen:

- Archive / restore = dominio + `save`.
- Purge = excepción operativa; nunca el camino por defecto.

---

## Tenant / Organización

Toda consulta de negocio respeta la **Organización** (Tenant).

El contrato expresa pertenencia al tenant en lenguaje de dominio (`TenantId` / Organización), no como detalle de RLS — aunque RLS lo refuerce en Infrastructure.

---

## Definition of Done — Contrato de Repository

Un contrato de repositorio se considera listo para tiparse en código cuando:

| # | Criterio |
|---|----------|
| ✓ | Existe `REPOSITORY_GUIDELINES.md` como estándar |
| ✓ | Existe `<Aggregate>Repository.md` con necesidades del dominio |
| ✓ | Operaciones en lenguaje ubicuo |
| ✓ | Sin mención obligatoria a SQL / proveedor |
| ✓ | Entradas/salidas son entidades, VOs o IDs |
| ✓ | Responsabilidades y no-responsabilidades explícitas |
| ✓ | Revisado contra este documento |

Solo entonces: `<Aggregate>Repository.ts` (interface).

---

## Regla de oro

Antes de añadir un método al contrato:

> **¿Lo necesita el dominio para recuperar o persistir el agregado, o estamos filtrando por comodidad de una pantalla / SQL?**

Si es lo segundo, no pertenece al contrato del Core.

---

## Declaración final

El segundo gran principio de YourMeal OS es:

> **El Core permanece estable mientras la infraestructura puede cambiar sin alterar el modelo de negocio.**

Los repositorios son la frontera que hace posible ese principio.

Cuando el contrato es pequeño, puro y previo a la tecnología, Supabase (u otro adaptador) es solo una implementación reemplazable.
