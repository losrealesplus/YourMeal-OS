# Contexto CTO · YourMeal OS

Documento de arranque **operativo** para sesiones de Cursor como CTO.  
Se apoya en el [Contexto Estratégico Permanente](./CONTEXTO_ESTRATEGICO_PERMANENTE.md). No sustituye los ADRs ni el Diario: los apunta.

**Idioma de trabajo:** español (código/BD en inglés).  
**Versión plataforma:** `v0.1.0` FOUNDATION LOCKED.

---

## Posición en la constitución

Este documento resume cómo arrancar una sesión. La dirección empresarial y del Core vive en [`CONTEXTO_ESTRATEGICO_PERMANENTE.md`](./CONTEXTO_ESTRATEGICO_PERMANENTE.md). El criterio de propósito y éxito del producto vive en [`FILOSOFIA_DE_PRODUCTO.md`](./FILOSOFIA_DE_PRODUCTO.md).

## Visión (resumen)

YourMeal OS — *The Operating System for Meal Prep & Catering*.

- SaaS **multi-tenant** para meal prep, catering y prepared food.
- **No** es solo una app de pedidos: es el sistema operativo del negocio.
- Primera implementación: **EatClean Tenerife**.
- Debe soportar cientos de empresas sin rediseñar.

Filosofía: una plataforma, un login, una BD, una fuente de verdad; permisos y departamentos distintos; tenant aislado.

---

## Roles de herramientas

| Quién | Qué hace |
|-------|----------|
| **Cursor (CTO)** | Arquitectura, dominio, implementación backend/servicios, ADRs, calidad |
| **`docs/` + ADRs** | Fuente de verdad |
| **Lovable** | UI / pantallas / componentes visuales bajo la constitución |
| **Código** | Sigue a la documentación |

ADR: [0012](../adr/0012-cursor-cto-lovable-ui.md)

---

## Decisiones permanentes (no negociar en features)

- Almacenamiento canónico (g, ml, km, °C, UTC, decimal + ISO currency)
- Localización solo en presentación (`useFmt`, nunca `toLocaleString` en UI de producto)
- Multi-tenant + RLS; sin datos de negocio compartidos
- Auth Supabase + profiles + RBAC por capabilities (no roles hardcodeados en UI)
- Reglas de negocio en Services; UI → Service → Repository → Supabase
- Soft delete: `archive` / `restore` / `purge`
- Audit log, feature flags preparados
- AI / offline: arquitectura lista, **no implementar aún**
- Tras v0.1.0: cambio estructural = **ADR**

---

## Qué ya está construido

```text
✓ GitHub / Supabase / Auth / Landing / Login
✓ Mobile Shell / Desktop Shell
✓ RBAC runtime (guards) + Multi-tenant + Localization/Regionalization
✓ Profiles / Tenants / Formatter (useFmt) / Design system base
✓ Navegación base / Foundation Lock / Constitución / Diario
✓ DishService + DishRepository (plantilla) — UI Module 01 aún no
```

Architecture Review ya realizado: [architecture-review.md](./architecture-review.md)  
Foundation Lock cerrado: [FOUNDATION_LOCK.md](./FOUNDATION_LOCK.md)

---

## Fase actual

```text
Blueprint ✅ → Foundation ✅ → Foundation Lock ✅
→ Module 01 Dish Library 🚧
```

Orden Module 01 (congelado):

```text
Dish → Ingredient → Recipe → Repos → Services → Rules → Tests → UI → CRUD
```

Dominio documentado:

- [Dish.md](../12-domain-model/module-01/Dish.md)
- [Ingredient.md](../12-domain-model/module-01/Ingredient.md)
- [Recipe.md](../12-domain-model/module-01/Recipe.md)

**No rehacer Architecture Review.** Aplicar arquitectura y avanzar dominio.

---

## Roadmap v1 (alto nivel)

Dish Library → Ingredient Library → Recipe Builder → Weekly Menus → Consumers / Company Accounts → Orders → Production → Kitchen → Inventory → Purchasing → Logistics → Accounting → Support → Reports → AI

---

## Cómo debe trabajar Cursor en cada tarea

1. Leer constitución / [Filosofía de Producto](./FILOSOFIA_DE_PRODUCTO.md) / ADRs / docs de dominio del módulo  
2. Principio de Intencionalidad (qué / cómo / por qué / para qué)  
3. Pregunta obligatoria: ¿hace que una cocina funcione mejor desde el primer día?  
4. Implementar alineado a docs  
5. Actualizar Diario si el hito queda Done  
6. Priorizar mantenibilidad y documentación sobre velocidad  

Cierre de jornada: [CIERRE_DE_JORNADA.md](./CIERRE_DE_JORNADA.md)  
Diario: [99-internal/development-journal](../99-internal/development-journal/README.md)  
DoD: [DEFINITION_OF_DONE.md](../00-status/DEFINITION_OF_DONE.md)
