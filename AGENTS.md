<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# YourMeal OS — Reglas para agentes

Priorizar mantenibilidad, arquitectura, código limpio y documentación.

## Idioma (ADR 0010)

Documentación y razonamiento en **español**. Código y BD en **inglés**.

## Principio de Intencionalidad (ADR 0011)

> Todo elemento debe justificar su existencia **antes** de implementarse.

Responder: ¿Qué es? ¿Cómo es? ¿Por qué existe? ¿Para qué sirve? ¿Qué problema resuelve? ¿Qué impacto tiene?

Registrar en el **Diario de Desarrollo** al terminar (antes de Done).

## Antes de escribir código

1. Constitución y ADRs  
2. Modelo de dominio / lenguaje ubicuo  
3. Docs Module 01 si aplica (`docs/12-domain-model/module-01/`)  
4. Servicios/módulos existentes  
5. Inconsistencias  
6. Solo entonces implementar  

## Fase actual

```text
Foundation Lock ✅  →  Module 01 Dish Library 🚧
```

Orden: Dish → Ingredient → Recipe → Repos → Services → Rules → Tests → **UI** → CRUD.

## Gobierno

| Tema | SoT |
|------|-----|
| Arquitectura / dominio | `docs/` + ADRs + Cursor |
| UI visual | Lovable (bajo constitución) |
| Memoria del porqué | `docs/99-internal/development-journal/` |

## Reglas permanentes (extracto)

- Canónico: g, ml, km, °C, UTC, decimal  
- `useFmt()` — no `toLocaleString` en UI de producto  
- Multi-tenant + RLS  
- Capabilities, no roles crudos  
- UI → Service → Repository → Supabase  
- `archive` / `restore` / `purge` — nunca `delete()` de negocio  
- `DomainError` + `ServiceContext`  
- Tras v0.1.0: cambio arquitectónico = ADR  
- Cierre de jornada: incluir Diario  

## Enlaces

- [Diario](./docs/99-internal/development-journal/README.md)
- [DoD](./docs/00-status/DEFINITION_OF_DONE.md)
- [Cierre](./docs/05-architecture/CIERRE_DE_JORNADA.md)
- [Dish](./docs/12-domain-model/module-01/Dish.md)
