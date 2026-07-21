# DOMAIN_DONE — Definition of Done del dominio

**Estándar oficial:** cuándo un elemento del dominio (entidad / agregado) se considera **terminado a nivel de dominio**.

No incluye infraestructura, persistencia ni UI. Esas capas tienen su propio avance y el [Definition of Done de módulo](../00-status/DEFINITION_OF_DONE.md).

**Código:** inglés · **Docs:** español (ADR 0010)

Relacionado: [ENTITY_GUIDELINES.md](./ENTITY_GUIDELINES.md) · [ACTORS.md](./ACTORS.md) · [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md)

---

## Propósito

Evitar debatir en cada entidad «¿está terminada?».

Si el checklist de este documento está completo, el dominio de ese concepto está **DONE**.

Lo que quede fuera (Repository, Application, Infrastructure, UI) pertenece a la **siguiente etapa de la arquitectura**, no a una ampliación prematura de la entidad.

---

## Checklist — Domain Done

Un elemento del dominio solo se considera terminado cuando cumple **todo** lo siguiente:

| # | Criterio |
|---|----------|
| ✓ | Documentación de dominio completa (`*.md` del concepto) |
| ✓ | Lenguaje ubicuo actualizado (término oficial, sin sinónimos ambiguos) |
| ✓ | Actores identificados (si el concepto involucra roles) |
| ✓ | Invariantes documentadas y protegidas en código |
| ✓ | Value Objects definidos (validación compleja fuera de la entidad) |
| ✓ | Domain Errors definidos |
| ✓ | State Machine documentada e implementada (si aplica ciclo de vida) |
| ✓ | Eventos de dominio identificados (definidos; emisión puede diferirse) |
| ✓ | Entidad implementada según [ENTITY_GUIDELINES.md](./ENTITY_GUIDELINES.md) |
| ✓ | Tests de dominio en verde |
| ✓ | Sin dependencias de infraestructura (UI, DB, ORM, HTTP, Supabase, …) |
| ✓ | Revisado contra `ENTITY_GUIDELINES.md` |
| ✓ | Intencionalidad respondida (qué / cómo / por qué / para qué) |
| ✓ | Entrada en el Diario de Desarrollo (al cerrar) |

---

## Qué NO forma parte de Domain Done

Deliberadamente **fuera** del cierre de dominio:

- Repository Interface
- Application Service / Use Cases
- Domain Service de orquestación entre agregados (salvo que el propio dominio lo exija ya)
- Adaptador de infraestructura
- Persistencia / migraciones
- Tests de integración
- RBAC / Feature Flags en la capa de aplicación
- UI / CRUD

> Riesgo a evitar: enamorarse de la primera entidad y convertirla en una «superentidad». Si falta comportamiento de otro módulo, se **diferirá**; no se inventará dentro de la entidad.

---

## Regla de oro

> Si para «terminar» la entidad hay que hablar de tablas, pantallas o APIs, **aún no** estamos en Domain Done: estamos mezclando capas.

---

## Aplicación

Reusable para:

- Dish ✅ (primera validación)
- Ingredient
- Recipe
- Order
- ProductionBatch
- y cualquier entidad futura del Core

---

## Relación con otros DoD

```text
DOMAIN_DONE.md          → el concepto de negocio está cerrado en dominio
ENTITY_GUIDELINES.md    → cómo se modela la entidad
DEFINITION_OF_DONE.md   → el módulo completo (dominio + app + infra + merge)
```

Un módulo no está Done solo con Domain Done.  
Pero **ningún módulo** debería avanzar a UI sin Domain Done de sus entidades centrales.
