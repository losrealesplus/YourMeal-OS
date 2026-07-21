# Entity Guidelines — Estándar de modelado de entidades

**Estándar oficial** para modelar entidades dentro del Core de YourMeal OS.

Su objetivo es garantizar que todas las entidades compartan la misma filosofía, estructura y comportamiento.

Una entidad **no** es simplemente una clase de código.

Es la representación de un concepto de negocio con **identidad propia** y comportamiento consistente.

**Código:** inglés · **Docs:** español (ADR 0010)

Relacionado: [`FOUNDATION.md`](../../FOUNDATION.md) (Entity Simplicity) · [ACTORS.md](./ACTORS.md) · [Dish.md](./module-01/Dish.md)

---

## Filosofía

Las entidades representan conceptos del dominio.

No representan tablas de base de datos.

No representan formularios.

No representan respuestas de APIs.

La implementación siempre es consecuencia del dominio.

Nunca al revés.

---

## Principios

Toda entidad debe:

- representar un concepto real del negocio;
- poseer una identidad única;
- proteger sus invariantes;
- mantener un estado consistente;
- encapsular únicamente el comportamiento que le pertenece;
- ser independiente de la interfaz;
- ser independiente de la infraestructura;
- ser reutilizable dentro del Core.

---

## Qué NO es una entidad

Una entidad nunca debe convertirse en:

- DTO
- Request
- Response
- Modelo ORM
- Registro de base de datos
- ViewModel

La persistencia es una responsabilidad de **Infrastructure**.

La presentación es una responsabilidad de **Presentation**.

---

## Identidad

Toda entidad posee una identidad única e inmutable.

Ejemplo:

```text
DishId
RecipeId
IngredientId
OrderId
```

La identidad nunca cambia durante el ciclo de vida de la entidad.

---

## Tenant

Toda entidad pertenece exactamente a una **Organización** (Tenant).

Ninguna entidad del dominio puede existir sin pertenecer a una Organización.

La pertenencia al Tenant forma parte del modelo de negocio, no únicamente de la seguridad.

Ver [ACTORS.md](./ACTORS.md).

---

## Ciclo de vida

Cada entidad define explícitamente su ciclo de vida.

Ejemplo:

```text
Draft
↓
Active
↓
Inactive
↓
Archived
```

Los estados forman parte del dominio.

No son simples cadenas de texto.

Ver [STATE_MACHINES.md](./STATE_MACHINES.md).

---

## Invariantes

Cada entidad protege sus propias reglas de negocio.

Una entidad nunca puede quedar en un estado inválido.

Si una operación rompe una invariante, debe rechazarse inmediatamente mediante un **Domain Error**.

---

## Value Objects

Las entidades nunca validan datos que pertenecen a un Value Object.

Incorrecto:

```typescript
if (name.length > 120)
```

Correcto:

```typescript
const name = DishName.create(value)
```

Las reglas viven donde pertenece el conocimiento.

---

## Responsabilidad

Cada entidad contiene únicamente el comportamiento que realmente le pertenece.

No debe asumir responsabilidades de otras entidades.

No debe conocer procesos externos.

No debe coordinar flujos complejos.

Si una operación requiere colaboración entre varias entidades, deberá resolverse mediante un **Domain Service** o un **Application Service**.

Principio transversal: [Entity Simplicity en FOUNDATION.md](../../FOUNDATION.md).

---

## Domain Events

Las entidades pueden generar eventos de dominio cuando ocurre un cambio relevante.

Ejemplos:

- `DishCreated`
- `RecipeAssigned`
- `OrderConfirmed`
- `ProductionCompleted`

Los eventos describen **hechos del negocio**.

No describen acciones técnicas.

---

## Auditoría

Toda entidad debe ser auditable.

Como mínimo:

- `createdAt`
- `updatedAt`

Cuando el dominio lo requiera también podrá incluir:

- `createdBy`
- `updatedBy`
- `archivedAt`
- `archivedBy`

La auditoría forma parte del Core porque representa trazabilidad del negocio.

---

## Soft Delete

Las entidades del Core nunca se eliminan físicamente cuando exista valor histórico.

La operación habitual será:

```text
Archive
```

No:

```text
Delete
```

Eliminar información de negocio debe ser una excepción explícitamente justificada (`purge`, SaaS Admin).

---

## Relaciones

Las entidades conocen únicamente las relaciones necesarias para cumplir sus responsabilidades.

No deben crear dependencias innecesarias.

Cada relación debe responder a una necesidad real del dominio.

---

## Simplicidad

Una entidad bien diseñada suele ser pequeña.

Cuando una entidad crece demasiado debemos preguntarnos:

- ¿Existe un Value Object que aún no hemos descubierto?
- ¿Hay una regla que pertenece a un Domain Service?
- ¿Estamos mezclando responsabilidades?

La primera solución nunca debe ser añadir más código.

Debe ser **comprender mejor el dominio**.

---

## Persistencia

Las entidades desconocen:

- SQL
- PostgreSQL
- Supabase
- Prisma
- Drizzle
- APIs
- HTTP
- JSON

Todo ello pertenece a **Infrastructure**.

---

## Presentación

Las entidades desconocen:

- React
- Next.js / Vite
- componentes
- formularios
- tablas
- modales
- iconos

La interfaz **nunca** modifica el dominio.

La interfaz **utiliza** el dominio.

---

## Definition of Done — Entidad

Una entidad solo se considera terminada cuando dispone de:

- propósito claramente definido;
- identidad;
- ciclo de vida;
- invariantes protegidas;
- Value Objects necesarios;
- Domain Errors;
- eventos definidos;
- relaciones justificadas;
- comportamiento encapsulado;
- documentación actualizada;
- pruebas de dominio.

La interfaz **no** forma parte del cierre de una entidad.

---

## Regla de oro

Antes de implementar cualquier entidad debemos ser capaces de responder:

> **¿Qué representa esta entidad dentro del negocio?**

Si la respuesta no puede explicarse sin hablar de pantallas, APIs o base de datos, todavía no entendemos suficientemente el dominio.

---

## Declaración final

Las entidades son el corazón del Core.

Cada entidad debe ser lo suficientemente pequeña para comprenderse rápidamente, lo suficientemente sólida para proteger el negocio y lo suficientemente estable para evolucionar durante años sin perder coherencia.

La calidad del Core no dependerá de la cantidad de entidades que existan.

Dependerá de la consistencia con la que todas ellas respeten este estándar.
