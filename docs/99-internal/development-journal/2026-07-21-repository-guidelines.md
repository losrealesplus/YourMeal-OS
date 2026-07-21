# Repository Guidelines + DishRepository.md

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library (persistencia / contratos)  
Estado: ✅ Docs del contrato — TS pendiente

---

## ¿Qué es?

La apertura de la **segunda gran etapa**: demostrar que la infraestructura se adapta al dominio, aplicando la misma metodología que Foundation Validation.

## ¿Cómo es?

```text
FOUNDATION
        ↓
REPOSITORY_GUIDELINES.md   ✅
        ↓
DishRepository.md          ✅
        ↓
DishRepository.ts          ⏳
```

- `docs/13-repositories/REPOSITORY_GUIDELINES.md`
- `docs/13-repositories/DishRepository.md`
- Principio **Repository Minimalism** también en `FOUNDATION.md`

## ¿Por qué existe?

Para no empezar por `interface DishRepository` en código y repetir el error de dejar que el código piense primero.

## ¿Para qué sirve?

- Estándar reutilizable para todos los repositorios del Core.
- Contrato de Dish en lenguaje ubicuo (save, findById, existsByName, list activos, find incluyendo archivados, purge).
- Separar contrato de `SupabaseDishRepository` / fakes.

## Objetivos

- Modelar el contrato antes del TypeScript.
- Validar el principio: Core estable, infra reemplazable.

## Reglas

- Sin SQL / Supabase en el contrato.
- Sin reglas de negocio en el repositorio.
- Sin DTOs: solo Entity / VO / IDs.

## Futuro

`DishRepository.ts` → Application Service → Supabase adapter.

## Decisiones tomadas

1. Misma disciplina que ENTITY_GUIDELINES → Dish.md → Dish.ts.
2. No se escribe la interface TypeScript en este paso.
3. Purge queda en el contrato como excepción explícita; archive es dominio + save.
