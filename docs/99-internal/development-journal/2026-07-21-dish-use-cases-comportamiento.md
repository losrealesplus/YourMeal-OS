# DISH_USE_CASES — del servicio al comportamiento

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library (Application)  
Estado: Canónico

---

## ¿Qué es?

El catálogo oficial de lo que una cocina puede hacer con un Dish: UC-001…UC-008.

Fuente: `docs/14-application/DISH_USE_CASES.md`.

## ¿Cómo es?

Cada caso de uso describe objetivo, actor, entradas, precondiciones, flujo, resultado, eventos, errores y **trazabilidad** (Entity → Repository → UseCase → Eventos → Tests).

Lenguaje de negocio. Sin clases en la narrativa.

## ¿Por qué existe?

Antes la metodología podía leerse centrada en **capas técnicas**. Ahora Application se centra en **comportamientos del negocio**.

Cursor no debe pensar «voy a implementar un Application Service».

Debe pensar «voy a implementar el caso de uso **Crear Plato**».

El Application Service, si existe, es solo el vehículo (fachada).

## ¿Para qué sirve?

Que cualquier desarrollador pueda empezar en el caso de uso y recorrer:

```text
Caso de uso → Dominio → Persistencia → Implementación → Pruebas
```

## Objetivos

- Formalizar UC-001…UC-008 con trazabilidad.
- Favorecer **un caso de uso por clase**.
- Dejar `DishApplication.md` como puntero histórico.
- Encadenar FOUNDATION → … → DISH_USE_CASES → CreateDishUseCase.

## Reglas

- Un UC = una acción comprensible para un usuario.
- Application coordina; el dominio decide.
- Repositories solo recuperan y persisten.
- Ningún UC conoce Supabase, HTTP o React.
- Purge no es UC de cocina.

## Dependencias

- APPLICATION_GUIDELINES.md
- Dish.md / DOMAIN_DONE
- DishRepository.md / DishRepository.ts

## Futuro

```text
CreateDishUseCase → … → Tests → (fachada opcional) → SupabaseDishRepository → UI
```

## Decisiones tomadas

1. Unidad de diseño = caso de uso, no Application Service.
2. Trazabilidad por UC como seña de identidad del Core.
3. `DishApplication.md` supersedido por `DISH_USE_CASES.md`.
