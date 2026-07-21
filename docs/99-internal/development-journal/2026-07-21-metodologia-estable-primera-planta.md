# Metodología estable — primera planta

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal → Module 01 (ingeniería)  
Estado: Canónico

---

## ¿Qué es?

Cierre de la etapa metodológica. Foundation y sus guidelines tienen **forma estable**.

No significa que nunca cambien. Significa que **ya no se añaden documentos porque sí**.

A partir de ahora el producto pone a prueba la metodología.

## ¿Cómo es?

Mapa actual de YourMeal OS:

```text
                    FOUNDATION
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
Product Philosophy   ACTORS        UBIQUITOUS LANGUAGE
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                 ENTITY_GUIDELINES
                         │
                  REPOSITORY_GUIDELINES
                         │
               APPLICATION_GUIDELINES
                         │
          ┌──────────────┴──────────────┐
          │                             │
     Dish.md                    DISH_USE_CASES.md
          │                             │
          └──────────────┬──────────────┘
                         │
               CreateDishUseCase
                         │
                  DishRepository
                         │
          SupabaseDishRepository
                         │
                    API / UI / IA
```

Por debajo de Foundation **no quedan decisiones arquitectónicas pendientes**.  
Lo que sigue son implementaciones.

## ¿Por qué existe?

Hasta ahora: «creo que deberíamos crear este documento».

A partir de ahora la respuesta preferida es:

> «No. Foundation ya responde esa pregunta.»

o

> «No añadamos otro documento; primero veamos si el producto realmente lo necesita.»

Eso es la señal de madurez.

## ¿Para qué sirve?

Cambiar el trabajo de **metodología** a **ingeniería**.

Secuencia definitiva:

```text
Guidelines
        ↓
Business Specification
        ↓
Implementation
        ↓
Tests
        ↓
Validation
```

Los cimientos ya demostraron que soportan peso. Toca construir la primera planta.  
Si aparece una grieta común en varias plantas, entonces se refuerza Foundation. Hasta entonces, la mejor forma de mejorar la metodología es construir producto sobre ella.

## Objetivos

- Registrar el cierre metodológico.
- Abrir la primera especificación de implementación: UC-001.
- Evitar nuevos estándares transversales sin necesidad demostrada por el producto.

## Reglas

- No añadir documentos de metodología «por completitud».
- Los docs bajo `use-cases/` son diseño de implementación, no Foundation.
- El código implementa el caso de uso, no «un Application Service».

## Dependencias

- FOUNDATION + guidelines (Entity / Repository / Application)
- DISH_USE_CASES.md
- [CreateDishUseCase.md](../../14-application/use-cases/CreateDishUseCase.md)

## Futuro

```text
CreateDishUseCase.ts → tests → resto de UCs → Supabase adapter → UI
```

## Decisiones tomadas

1. Metodología = estable (viva, no «cerrada para siempre»).
2. Siguiente trabajo = ingeniería (UC-001 primero).
3. Último documento metodológico de esta etapa: este registro + diseño UC-001 (especificación, no guideline).
