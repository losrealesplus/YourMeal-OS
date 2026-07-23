# CAP-002 — Dish Catalog

**Estado:** Scaffold → **Connected** (siguiente)  
**Master:** [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md)

---

## 1. Objetivo

Sustituir catálogo mock por datos reales de Supabase (Dish).

## 2. Alcance

Repository · Query · Cache · Hooks · Adapters.

## 3. No modificar

Componentes visuales · DishCard · UX · navegación · campos del modelo Dish.

## 4. Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-002 Dish Catalog |
| Core Object | Dish |
| Supporting | Ingredient (solo si lectura ya justificada; no expandir) |
| OM | `docs/17` · Module 01 Dish |
| Infra | Supabase · Service/Repository · i18n · useFmt |

## 5. Criterios Connected

Ver [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md) · Scaffold → Connected.

## 6. Prompt

```text
Implementar CAP-002 Dish Catalog.

Objetivo: sustituir el catálogo mock por datos reales de Supabase.

No modificar componentes.
No modificar DishCard.
No modificar UX.
No modificar navegación.
No añadir campos.

Solo conectar: Repository · Query · Cache · Hooks · Adapters.

Mantener typecheck limpio.
Cerrar con el formato oficial del Master Prompt (Etapa 2).
Knowledge Review requerido: No (salvo hallazgo).
Estado final objetivo: Connected.
```
