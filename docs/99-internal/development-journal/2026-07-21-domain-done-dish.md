# Domain Done · Cierre metodológico de Dish

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: ✅ Dish Domain Done

---

## ¿Qué es?

El cierre metodológico de `Dish` a nivel de dominio y la adopción de `DOMAIN_DONE.md` como Definition of Done reutilizable para todas las entidades del Core.

## ¿Cómo es?

- Acta: `docs/00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md` (ampliada: cerrado vs fuera)
- Estándar: `docs/12-domain-model/DOMAIN_DONE.md`
- Sin cambios de código

## ¿Por qué existe?

Para no volver a discutir cuándo una entidad está «terminada» y para no seguir añadiendo comportamiento a Dish (riesgo de superentidad).

## ¿Para qué sirve?

- Checklist claro Domain Done vs DoD de módulo.
- Marcar Dish como cerrado en dominio.
- Guiar Ingredient, Recipe, Order con el mismo criterio.

## Objetivos

- Cerrar Dish en dominio.
- Congelar DOMAIN_DONE.md.
- Dejar explícito el siguiente paso: Repository Interface.

## Reglas

- Domain Done ≠ módulo Done.
- Fuera de Domain Done: repo, app, infra, UI.
- No ampliar Dish ahora.

## Dependencias

- ENTITY_GUIDELINES, milestone de validación, entidad Dish + tests

## Futuro

Repository Interface → Application Service → … → UI.

## Decisiones tomadas

1. Dish está **Domain Done**.
2. `DOMAIN_DONE.md` es el DoD del dominio para el Core.
3. El foco pasa a la arquitectura por capas, no a más comportamiento en Dish.
