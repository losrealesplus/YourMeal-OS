# Entity Guidelines · Estándar de modelado

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (dominio)  
Estado: ✅ Incorporado

---

## ¿Qué es?

El estándar oficial para modelar entidades del Core: identidad, tenant, ciclo de vida, invariantes, VOs, eventos, auditoría, soft delete y límites con infraestructura/UI.

## ¿Cómo es?

Documento en `docs/12-domain-model/ENTITY_GUIDELINES.md`, enlazado desde el modelo de dominio, DoD, AGENTS y el README de `entities/` de Dish Library.

Complementa **Entity Simplicity** en `FOUNDATION.md` con el checklist operativo completo.

## ¿Por qué existe?

Sin estándar, cada módulo inventaría su propia idea de «entidad» (DTO, fila ORM, ViewModel). Eso rompe el Core y hace imposible reutilizar capacidades entre Organizaciones.

## ¿Para qué sirve?

- Guiar la implementación de `Dish` y todas las entidades posteriores.
- Separar dominio de persistencia y presentación.
- Definir cuándo una entidad está realmente Done (sin UI).

## Objetivos

- Fijar el estándar antes de escribir la entidad `Dish`.
- Unificar DoD de entidad con el DoD de módulo.
- Evitar que la primera entidad del Core nazca como CRUD disfrazado.

## Reglas

- Entidad ≠ tabla ≠ formulario ≠ API.
- Tenant obligatorio.
- Soft delete vía Archive.
- Validación en Value Objects.
- Pregunta de oro: ¿qué representa en el negocio?

## Dependencias

- `FOUNDATION.md` (Entity Simplicity)
- `ACTORS.md`
- `Dish.md` (dominio cerrado)
- Lenguaje de dominio Dish ya en código

## Futuro

- Primera aplicación real: entidad `Dish` bajo este estándar.
- Reutilizar el mismo checklist para Ingredient y Recipe.

## Decisiones tomadas

1. `ENTITY_GUIDELINES.md` es el estándar de modelado de entidades del Core.
2. El DoD de entidad excluye UI.
3. Dish será la primera entidad que deberá demostrar que el estándar es operable.
