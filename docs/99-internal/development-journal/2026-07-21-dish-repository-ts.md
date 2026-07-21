# DishRepository.ts · Primer contrato tipado del Core

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: ✅ Interface de dominio

---

## ¿Qué es?

La interface `DishRepository` tipada como consecuencia de `REPOSITORY_GUIDELINES` + `DishRepository.md`, tras documentar el **Repository Contract Pattern** (común implícito vs específico del agregado).

## ¿Cómo es?

- Docs: patrón común, archive vs purge, checklist previo.
- Código: `src/modules/dish-library/domain/repositories/dish-repository.ts`
- Sin `BaseRepository<T>`, sin Supabase, sin Application.

## ¿Por qué existe?

Para validar el segundo principio: Core estable; infraestructura reemplazable — empezando por un contrato pequeño y aburrido.

## ¿Para qué sirve?

- Frontera clara para `SupabaseDishRepository` / fakes.
- `existsByName` queda como operación **específica** de Dish.
- Si “faltan cosas”, probablemente pertenecen a Application u otro agregado.

## Objetivos

- Corregir enfoque (patrón vs Dish) antes del TS.
- Materializar el contrato.
- No abrir nuevo debate metodológico: siguiente = Application Layer Guidelines.

## Decisiones tomadas

1. Patrón común **documentado**, no interfaz genérica obligatoria.
2. Archive = dominio; purge = excepción en el contrato.
3. Secuencia fija: Application Guidelines → Service → Use Cases → Supabase adapter.
