# Foundation Lock — cierre de plataforma

Fecha: 2026-07-20  
Versión: v0.1.0  
Módulo: Plataforma / Arquitectura  
Estado: ✅ Cerrado (FOUNDATION LOCKED)

---

## ¿Qué es?

El **Foundation Lock** es el hito que convierte reglas documentadas en garantías de runtime: la arquitectura deja de ser intención y queda respaldada por el código.

Se creó / consolidó:

- Guards RBAC en rutas (`/admin`, `/saas`, `/driver`, `/admin/dishes`)
- Soft delete operativo (`archive` / `restore` / `purge`)
- `ServiceContext` unificado + `createServiceContext()`
- Patrón Service → Repository (Dish como plantilla)
- Errores de dominio tipados
- Matriz de capabilities, estados oficiales, catálogo de entidades
- Scaffold de eventos (`packages/events`)
- Convención `src/modules/<nombre>/...`
- Tag `v0.1.0`

---

## ¿Cómo es?

```text
Route → Permission Guard → Service → Repository → Supabase (RLS)
```

- Documentación en `docs/05-architecture/FOUNDATION_LOCK.md` + ADR 0009
- Código en `src/permissions`, `src/domain`, `src/modules/dish-library`, migraciones soft-delete/RBAC
- Capas de módulo: domain / application / infrastructure / presentation

---

## ¿Por qué existe?

**Problema:** “Foundation is real. The risk is false readiness.” Existían ADRs y scaffolding, pero un usuario autenticado podía abrir `/admin` o `/saas`, y el hard `DELETE` seguía permitido en tablas de negocio.

**Antes:** reglas en docs sin enforcement completo.  
**Mejora:** la plataforma no se puede saltar por accidente al construir módulos.  
**Decisión:** no empezar Dish Library UI hasta cerrar el lock.

---

## ¿Para qué sirve?

| Aporta a | Valor |
|----------|--------|
| Usuario final | Aún no (infra); asegura que lo que venga respetará permisos y datos |
| Empresa | Base SaaS multi-tenant creíble para EatClean y futuros tenants |
| Sistema | Contrato estable: sin rediseñar la base en cada módulo |

---

## Objetivos

**Principal:** cerrar la plataforma antes del primer módulo de negocio.

**Secundarios:**

- Unificar contexto de servicios
- Separar reglas (Service) de persistencia (Repository)
- Preparar eventos y módulos sin implementar AI/offline

---

## Reglas

- Tras `v0.1.0`, **ningún cambio arquitectónico sin ADR**
- Nunca `delete()` de negocio en Services — solo `archive` / `restore` / `purge`
- Capabilities, no roles crudos en features
- Documentación en español; código/BD en inglés

---

## Dependencias

**Necesita:** Foundation (auth, tenants, schema, i18n, shells).

**Lo utilizan:** todos los módulos futuros (Module 01+).

**Dependerán de él:** Dish Library, Ingredient Library, Recipe Builder, y el resto del roadmap.

---

## Futuro

- Filtrado de navegación admin por capabilities (pulido)
- ADR de junction tables (soft-delete vs cascade)
- Emisión real de domain events cuando haga falta

---

## Decisiones tomadas

- Llamar al gate **Foundation Lock** (no solo “P0”)
- Soft delete con `purge` solo SaaS Admin
- Roadmap de catálogo: Dish → Ingredient → Recipe (tres conceptos)
- Tag `v0.1.0 FOUNDATION LOCKED`
- ADR 0009 (Foundation Lock), ADR 0010 (idioma)

Referencias: ADR 0009, ADR 0010, Architecture Review, CHANGELOG v0.1.0
