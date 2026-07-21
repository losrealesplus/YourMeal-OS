# Application Guidelines — Estándar de la capa de Aplicación

**Estándar oficial** para la capa de Aplicación de YourMeal OS.

Su objetivo es establecer cómo se coordinan los casos de uso del negocio **sin** introducir reglas de dominio en la infraestructura ni contaminar las entidades.

La capa de Aplicación conecta el dominio con el mundo exterior.

No implementa el negocio.

**Orquesta** el negocio.

**Código:** inglés · **Docs:** español (ADR 0010)

Relacionado: [`FOUNDATION.md`](../../FOUNDATION.md) · [ENTITY_GUIDELINES.md](../12-domain-model/ENTITY_GUIDELINES.md) · [REPOSITORY_GUIDELINES.md](../13-repositories/REPOSITORY_GUIDELINES.md)

---

## Filosofía

Las entidades toman decisiones.

Los Value Objects protegen invariantes.

Los Repositories recuperan y persisten agregados.

La capa de Aplicación coordina todo ello.

Nunca sustituye al dominio.

Nunca lo duplica.

---

## Principio de Orquestación

> La capa de Aplicación no toma decisiones de negocio. Coordina decisiones tomadas por el dominio. Cuanto menos conocimiento de negocio exista en Application, más fuerte será el Core.

## Principio de claridad del caso de uso

> Cada caso de uso debe representar una acción que un usuario real pueda comprender y ejecutar. Si un caso de uso no puede describirse sin hablar de clases, servicios o bases de datos, todavía no pertenece a la capa de Aplicación.

Este principio es a Application lo que **Entity Simplicity** es al dominio.

## Principio de especificabilidad del caso de uso

> Un caso de uso está terminado cuando cualquier desarrollador puede implementarlo correctamente leyendo únicamente su especificación.

La especificación es un contrato entre Producto y Desarrollo — no documentación decorativa. El código la traduce; no la redefine.

Las especificaciones de implementación viven en `docs/14-application/use-cases/` (p. ej. [CreateDishUseCase.md](./use-cases/CreateDishUseCase.md)). No son documentos de Foundation.

---

## Responsabilidad

La unidad de diseño es el **caso de uso** (`CreateDishUseCase`, …).

Un Application Service, si existe, es una **fachada opcional** que agrupa casos de uso — no el centro del diseño.

Cada caso de uso puede:

- recuperar entidades mediante Repositories;
- coordinar varias entidades;
- invocar Domain Services;
- iniciar o finalizar transacciones (cuando corresponda);
- publicar Domain Events después de una operación exitosa;
- devolver el resultado del caso de uso;
- aplicar autorización (RBAC / capabilities);
- coordinar auditoría.

No puede modificar las reglas del dominio.

---

## Qué NO es

Un Application Service no es:

- una entidad;
- un Repository;
- un controlador HTTP;
- un endpoint;
- una API;
- un servicio de Supabase;
- un servicio de React;
- una clase utilitaria.

Su única responsabilidad es coordinar un caso de uso.

---

## Qué conoce

Puede conocer:

- Entidades
- Value Objects
- Repositories (contratos)
- Domain Services
- Domain Events
- Identificadores
- Casos de uso
- ServiceContext / capabilities (autorización)

### No conoce

- React
- Next.js / Vite
- Supabase
- PostgreSQL
- Prisma
- Drizzle
- HTTP
- REST
- GraphQL
- Componentes UI

Toda dependencia tecnológica pertenece a **Infrastructure**.

---

## Reglas de negocio

Las reglas pertenecen al dominio.

Si durante la implementación aparece una regla nueva:

**No** debe implementarse en Application.

Debe volver al dominio.

---

## Coordinación

La capa de Aplicación puede coordinar múltiples agregados.

Ejemplo:

- obtener un Dish;
- validar una Recipe;
- actualizar Inventory;
- publicar un evento.

Cada decisión continúa perteneciendo a su propio agregado.

---

## Repositories

Application utiliza Repositories.

Nunca conoce cómo están implementados.

Solo conoce el **contrato** del dominio (`DishRepository`, …).

---

## Domain Events

Los eventos representan hechos del negocio.

La capa de Aplicación puede publicarlos una vez que el caso de uso termina correctamente (p. ej. tras `pullDomainEvents()` + persistencia exitosa).

Nunca modifica el significado de un evento.

---

## Transacciones

Cuando un caso de uso modifica múltiples agregados, la coordinación transaccional pertenece a la capa de Aplicación.

Las entidades desconocen las transacciones.

Los Repositories tampoco las controlan.

---

## Autorización

RBAC, permisos y autorización pertenecen a la capa de Aplicación.

Las entidades no conocen usuarios autenticados.

Solo conocen conceptos del dominio.

---

## Auditoría

La recopilación de información de auditoría se coordina desde Application.

El dominio no conoce quién pulsó un botón.

Conoce únicamente cambios válidos del negocio.

---

## Errores

Application **no** transforma errores de dominio.

Los propaga.

Puede añadir errores propios relacionados con la coordinación del caso de uso (p. ej. permiso denegado).

Nunca modifica el significado de un Domain Error.

---

## Resultado

Un Application Service devuelve el resultado del caso de uso.

No devuelve respuestas HTTP.

No devuelve componentes.

No devuelve objetos específicos de infraestructura.

---

## Simplicidad

Un Application Service debe ser pequeño.

Si contiene demasiadas reglas de negocio:

→ la lógica pertenece al **dominio**.

Si contiene demasiados detalles técnicos:

→ la lógica pertenece a **Infrastructure**.

---

## Flujo oficial

Todo caso de uso debe seguir el mismo flujo.

```text
Request
        ↓
Application
        ↓
Repository
        ↓
Domain
        ↓
Repository
        ↓
Application
        ↓
Result
```

La infraestructura únicamente proporciona las implementaciones necesarias para ejecutar este flujo.

---

## Nombre y ubicación

| Concepto | Convención |
|----------|------------|
| Documento de caso(s) de uso | `docs/14-application/<Aggregate>Application.md` (cuando exista) |
| Servicio de aplicación | `<Aggregate>ApplicationService` o casos de uso explícitos |
| Código | `src/modules/<module>/application/` |

El Application Service existente legado (`DishService` actual) deberá **alinearse** a este estándar; no redefine el estándar.

---

## Relación con capas

```text
ENTITY_GUIDELINES        → qué es una entidad
REPOSITORY_GUIDELINES    → cómo se persiste sin tecnología
APPLICATION_GUIDELINES   → cómo se orquesta un caso de uso
Infrastructure           → cómo se implementa la tecnología
Presentation             → cómo se muestra el resultado
```

---

## Definition of Done

Un Application Service se considera terminado cuando:

- implementa un único caso de uso (o un conjunto cohesivo documentado);
- utiliza exclusivamente contratos del dominio;
- no contiene reglas de negocio;
- coordina correctamente entidades y repositorios;
- permanece independiente de la infraestructura;
- está documentado;
- dispone de pruebas de aplicación.

---

## Flujo de modelado (misma disciplina)

```text
APPLICATION_GUIDELINES
        ↓
DISH_USE_CASES.md   (casos de uso — negocio)
        ↓
CreateDishUseCase / … (código — un UC por clase)
        ↓
SupabaseDishRepository (infra)
```

No empezar por código de Application sin casos de uso documentados.
Una fachada `DishApplicationService` es **opcional**; la unidad de diseño es el caso de uso.

---

## Declaración final

La capa de Aplicación existe para conectar el dominio con el exterior **sin alterar su integridad**.

Las entidades representan el conocimiento.

Los Repositories representan el acceso al conocimiento.

Application representa la **coordinación** del conocimiento.

Mantener separadas estas responsabilidades es lo que permite que el Core evolucione durante años sin depender de una tecnología concreta.
