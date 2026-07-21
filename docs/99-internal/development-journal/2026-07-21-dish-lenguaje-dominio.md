# Dish · Lenguaje del dominio en código

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: 🚧 En progreso (lenguaje creado; entidad pendiente)

---

## ¿Qué es?

La primera implementación real del enfoque **modelar antes de implementar**: estructura del dominio, Value Objects, errores, máquina de estados y eventos definidos — sin entidad `Dish` todavía.

## ¿Cómo es?

Estructura en `src/modules/dish-library/domain/`:

```text
domain/
  entities/        (pendiente)
  value-objects/   DishName, PortionSize, Money, Calories
  errors/          DishNameRequired, DishNameTooLong, …
  types/           DishStatus + mapeo persistencia
  events/          eventos definidos, no emitidos
  repositories/    placeholder
  services/        placeholder
```

## ¿Por qué existe?

La metodología pasó su primer examen al detectar `published` vs `active/inactive` en documentación antes de llegar al código. El siguiente paso debe mantener esa disciplina: primero lenguaje, luego entidad.

## ¿Para qué sirve?

- Evitar validaciones primitivas (`if (name.length > 120)`) dispersas en entidades o UI.
- Hacer que `Dish` nazca compuesto solo de conceptos de dominio ya existentes.
- Establecer el patrón reusable para Ingredient y Recipe.

## Objetivos

- Crear namespace del dominio.
- Implementar Value Objects mínimos.
- Implementar errores de dominio del módulo.
- Implementar `DishStatus` como máquina de estados, no strings libres.
- Dejar eventos definidos para futura emisión.

## Reglas

- No implementar la entidad `Dish` en este paso.
- No implementar UI ni CRUD.
- Validación compleja en Value Objects, no en entidades.
- Principio añadido a `FOUNDATION.md`: **Entity Simplicity**.

## Dependencias

- `docs/12-domain-model/module-01/Dish.md` (dominio cerrado)
- `FOUNDATION.md`
- `AGENTS.md`

## Futuro

- Entidad `Dish` usando exclusivamente VOs, errores y `DishStatus`.
- Repository interface de dominio.
- Tests del dominio.

## Decisiones tomadas

1. El orden de Module 01 pasa a: Language → VOs → Errors → State Machine → Entity → …
2. Se eliminan los stubs previos `entities.ts` y `states.ts` con semántica `published`.
3. `inactive` existe en dominio; persistencia legacy no lo soporta aún (falla explícita al mapear).
4. CRUD deja de ser hito explícito: es consecuencia natural del pipeline.
