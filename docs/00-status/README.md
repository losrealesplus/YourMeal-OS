# Estado del proyecto

**Última actualización:** 2026-07-21  
**Versión:** `v0.1.0` — FOUNDATION LOCKED

## Fase oficial

```text
FASE 0 — FUNDACIÓN
Blueprint              ✅
Foundation             ✅
Foundation Lock        ✅
Global Foundation      ✅
Constitución           ✅
Arquitectura           ✅
Metodología            ✅
Contexto Estratégico   ✅
Filosofía de Producto  ✅
Actores                ✅
Lenguaje ubicuo        ✅
Entity Guidelines      ✅
Fundación del dominio  ✅  ← cerrada
────────────────────────
FASE 1 — Core v0.1 (EatClean)
Module 01 · Dish Library 🚧
  Dominio documentado     ✅
  Lenguaje en código      ✅
  Entidad Dish            ✅
  Repository Interface    ⏳
  Application Service     ⏳
  UI                      ⏳
```

> La Fase 0 construyó la empresa y su sistema de decisión.  
> **La fundación del dominio está cerrada:** el código es consecuencia, no el inicio.  
> **La Fase 1** materializa producto a través de EatClean.

> **La arquitectura ya no se diseña; se aplica.**

## Constitución (resumen)

| Pilar | Principio |
|-------|-----------|
| Arquitectura | Docs + ADRs son la fuente de verdad; **Cursor = CTO**; Lovable = UI |
| Desarrollo | Español en docs/razonamiento; inglés en código/BD |
| Calidad | Intencionalidad + Definition of Done + no estado amarillo |
| Memoria | Diario de Desarrollo del Proyecto |
| Cierre diario | Protocolo de 7 pasos (incluye Diario) |
| Contexto sesiones | [CONTEXTO_CTO.md](../05-architecture/CONTEXTO_CTO.md) |
| Pirámide de decisión | Jerarquía docs → código en [`AGENTS.md`](../../AGENTS.md) |
| Valor (Module 01+) | Código para la Organización (EatClean) o para fortalecer el Core |
| Filosofía de producto | [FILOSOFIA_DE_PRODUCTO.md](../05-architecture/FILOSOFIA_DE_PRODUCTO.md) — impacto operativo |
| Actores | [ACTORS.md](../12-domain-model/ACTORS.md) — roles oficiales del dominio |
| Entity Guidelines | [ENTITY_GUIDELINES.md](../12-domain-model/ENTITY_GUIDELINES.md) — estándar de entidades |

## Module 01 — ahora

Dominio primero (sin UI):

- [Dish.md](../12-domain-model/module-01/Dish.md)
- [Ingredient.md](../12-domain-model/module-01/Ingredient.md)
- [Recipe.md](../12-domain-model/module-01/Recipe.md)

**Objetivo de Module 01:** validar la constitución materializando `Dish` como consecuencia de Entity Guidelines.

**Hecho:** entidad `Dish` + tests de dominio (`vitest`).

**Próximo paso:** Repository Interface de dominio → adaptar Application Service — sin pantalla.

## Misión v0.1

> Construir la mejor plataforma posible para EatClean y convertir cada aprendizaje real en una capacidad reusable del Core.

## Enlaces

- [Diario](../99-internal/development-journal/README.md)
- [Definition of Done](./DEFINITION_OF_DONE.md)
- [Cierre de jornada](../05-architecture/CIERRE_DE_JORNADA.md)
- [Roadmap](../roadmap/README.md)
