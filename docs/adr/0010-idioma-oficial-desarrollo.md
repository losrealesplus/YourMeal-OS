# ADR 0010 — Idioma oficial del desarrollo

## Estado

Aceptado — 2026-07-20

## Contexto

YourMeal OS es un producto **multilenguaje para los usuarios**, pero el equipo necesita una única lengua de trabajo para evitar el patrón típico: lógica en inglés, documentación en español e interfaz mezclada.

## Decisión

**El idioma oficial del desarrollo es el español.**

| Ámbito | Idioma |
|--------|--------|
| Código (variables, funciones, clases, interfaces) | **Inglés** (estándar de programación) |
| Base de datos (tablas, columnas, enums) | **Inglés** (`dishes`, no `platos`) |
| Documentación (ADRs, arquitectura, roadmap, reglas, dominio, comentarios importantes) | **Español** |
| Respuestas y razonamiento de Cursor | **Español** (salvo al generar código) |
| Prompts a Lovable | Inglés permitido si mejora resultados; la referencia oficial sigue siendo la documentación en español |
| Traducciones de la app (`i18n`) | Independientes del idioma de desarrollo |

### Ejemplos de código correctos

- `DishService`, `WeeklyMenu`, `InventoryRepository`
- Tablas: `dishes`, `ingredients`, `weekly_menus`

### Ubiquitous Language

Los **términos de dominio** en código y BD permanecen en inglés (`Dish`, `Recipe`). Su definición y explicación viven en documentación en español (`docs/12-domain-model/UBIQUITOUS_LANGUAGE.md`).

## Consecuencias

- Nueva documentación se escribe en español.
- Documentos históricos en inglés se migran progresivamente (prioridad: status, roadmap, Foundation Lock, ADRs nuevos).
- Cursor razona en español.
- No se mezclan idiomas en la constitución del proyecto.
