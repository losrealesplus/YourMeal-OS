# ADR 0011 — Diario de Desarrollo y Principio de Intencionalidad

## Estado

Aceptado — 2026-07-20

## Contexto

El código explica **cómo** funciona algo. El proyecto necesita un registro de **por qué existe**. Sin él, el conocimiento se pierde y el repositorio crece sin construir memoria.

## Decisión

### 1. Diario de Desarrollo del Proyecto

- Ubicación: `docs/99-internal/development-journal/`
- Carácter: **interno**, historial intelectual; no es documentación de producto ni guía de API.
- Formato: **un documento por jornada o por hito** (no un único archivo enorme).
- Nombre: **Diario de Desarrollo del Proyecto** (*Project Development Journal*).
- Regla: **cada funcionalidad se documenta cuando queda terminada y antes de considerarla Done**.
- Forma parte del **cierre de jornada**.

### 2. Principio de Intencionalidad

> **Todo elemento del sistema debe justificar su existencia antes de ser implementado.**

Antes de implementar hay que responder:

- ¿Qué es?
- ¿Cómo es?
- ¿Por qué existe?
- ¿Para qué sirve?
- ¿Qué problema resuelve?
- ¿Qué impacto tendrá en el resto del sistema?

Solo entonces comienza la implementación. El Diario captura esas respuestas.

### 3. Relación con Definition of Done

Una entrada (o actualización) en el Diario es **requisito** para marcar un módulo/hito como Done, junto al resto del checklist.

## Consecuencias

- Más disciplina y trazabilidad a 1–5 años.
- El cierre diario incluye actualizar el Diario.
- Module 01 y siguientes nacen con fichas de intención antes del código de UI.
