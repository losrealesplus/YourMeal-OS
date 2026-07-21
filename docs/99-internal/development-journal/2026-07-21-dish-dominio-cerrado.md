# Dish · Dominio cerrado antes de implementación

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: ✅ Cerrado a nivel de dominio

---

## ¿Qué es?

El cierre formal del dominio de `Dish` como fuente de verdad previa a implementación.

No es todavía la implementación de la entidad. Es la definición oficial de su comportamiento de negocio.

## ¿Cómo es?

Se actualiza `docs/12-domain-model/module-01/Dish.md` para fijar:

- misión del agregado;
- responsabilidades y no-responsabilidades;
- estados `draft → active → inactive → archived`;
- invariantes;
- Value Objects candidatos;
- relaciones;
- eventos de dominio;
- operaciones permitidas;
- reglas de negocio;
- casos límite;
- Definition of Done del dominio.

También se alinean:

- `docs/12-domain-model/STATE_MACHINES.md`
- `docs/12-domain-model/UBIQUITOUS_LANGUAGE.md`

## ¿Por qué existe?

Porque Module 01 debe validar que la constitución funciona: primero dominio, después implementación. Si `Dish` no queda cerrado conceptualmente, cualquier código posterior arrastra ambigüedad.

## ¿Para qué sirve?

- Evitar que la implementación tome decisiones de negocio por su cuenta.
- Convertir `Dish` en capacidad reusable del Core.
- Asegurar que EatClean guía el alcance sin reducir el modelo a un caso aislado.

## Objetivos

- Cerrar completamente el comportamiento esperado de `Dish`.
- Eliminar contradicciones previas (`published` vs `active/inactive`).
- Preparar el paso siguiente: entidad y Value Objects en código.

## Reglas

- El dominio manda sobre la implementación.
- Si la persistencia actual no soporta `inactive`, se adapta la persistencia; no se degrada el dominio.
- No existe delete físico como operación de negocio.
- La interfaz no forma parte del cierre del dominio.

## Dependencias

- `FOUNDATION.md`
- `AGENTS.md`
- `docs/12-domain-model/module-01/Dish.md`
- `docs/12-domain-model/STATE_MACHINES.md`
- `docs/12-domain-model/UBIQUITOUS_LANGUAGE.md`

## Futuro

- Implementar entidad `Dish` en `src/modules/dish-library/domain/`.
- Seleccionar y construir los Value Objects mínimos reales (`DishName`, `Price`, etc.).
- Definir Repository Interface y tests de dominio.

## Decisiones tomadas

1. `Dish` deja de usar semántica de `published` y adopta `active/inactive`.
2. `Dish` se define explícitamente como unidad de negocio, no solo receta.
3. Se incorporan `Category`, `Tags`, `Nutrition` y `Yield` como preocupaciones del dominio.
4. La DoD de `Dish` excluye UI y cierra únicamente dominio.
