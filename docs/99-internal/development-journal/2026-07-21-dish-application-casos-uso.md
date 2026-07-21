# DishApplication.md · Casos de uso antes del servicio

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library (Application)  
Estado: ✅ Casos de uso documentados — código pendiente

---

## ¿Qué es?

La documentación de **negocio** de lo que una cocina necesita hacer con un Dish, antes de escribir `DishApplicationService`.

## ¿Cómo es?

`docs/14-application/DishApplication.md` con:

- Crear, actualizar, activar, desactivar, archivar, restaurar, duplicar, asignar Recipe
- Vertical slices (`CreateDishUseCase`, …)
- Principio de claridad del caso de uso (FOUNDATION + APPLICATION_GUIDELINES)

## ¿Por qué existe?

Application no existe por sí mismo: existe para ejecutar casos de uso. Diseñar el servicio primero sería diseñar desde el código.

## ¿Para qué sirve?

- Que el próximo código sea consecuencia, no diseño.
- Hablar el lenguaje de la cocina, no de clases.
- Separar archive (cocina) de purge (plataforma).

## Objetivos

- No escribir Application Service en este paso.
- Fijar Use Case Clarity como principio paralelo a Entity Simplicity.

## Futuro

```text
DishApplication.md ✅ → Use Cases / Service → Tests → Supabase → UI MVP

> **Actualización (misma jornada):** supersedido por [DISH_USE_CASES.md](../../14-application/DISH_USE_CASES.md) y la ficha [2026-07-21-dish-use-cases-comportamiento.md](./2026-07-21-dish-use-cases-comportamiento.md). Unidad de diseño = un UC por clase; Application Service solo fachada opcional.
```

## Decisiones tomadas

1. Casos de uso primero; servicio después.
2. Pensar en slices aunque se agrupen al inicio.
3. YourMeal OS empieza a resolver problemas reales de cocina, no solo a habilitar el framework.
