# CreateDishUseCase — primera planta

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library (Application)  
Estado: Implementado

---

## ¿Qué es?

Primera traducción de una especificación de caso de uso a código: UC-001.

## ¿Cómo es?

- Contrato conversacional: `docs/14-application/use-cases/CreateDishUseCase.md`
- Código: `CreateDishUseCase.ts` + ports + tests (15/15 suite, 4 UC)
- Principio **Use Case Specificity** en FOUNDATION / APPLICATION_GUIDELINES

## ¿Por qué existe?

Para demostrar que documentación y código se refuerzan: el `.md` responde *¿qué hace?* sin abrir el `.ts`.

## ¿Para qué sirve?

Primera planta del edificio: ingeniería sobre metodología estable.

## Objetivos

- Especificación como contrato Producto ↔ Desarrollo.
- Implementación línea a línea desde el flujo documentado.
- Sin infraestructura en el caso de uso.

## Reglas

- Solo contratos: DishRepository, EventPublisher, IdGenerator, Clock.
- Resultado de aplicación, no HTTP/React.
- Unicidad → `DishAlreadyExists`.

## Dependencias

- DISH_USE_CASES.md / Dish domain / DishRepository contract

## Futuro

```text
Update / Activate / … UseCases → SupabaseDishRepository → UI
```

## Decisiones tomadas

1. Especificación conversacional (11 secciones + invariantes) antes del código.
2. Use Case Specificity como principio.
3. `DishService` legado no redefine el estándar; convive hasta alinear.
