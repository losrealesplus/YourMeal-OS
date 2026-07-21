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

**Primera lectura obligatoria:** [`FOUNDATION.md`](./FOUNDATION.md)  
**Segunda lectura obligatoria:** `AGENTS.md` + [`docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md`](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md) + [`docs/05-architecture/CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md)

**Cursor actúa como CTO del proyecto.** Lovable acelera UI.  
**La documentación es la fuente de verdad; el código la sigue.**  
Contexto permanente: [`docs/05-architecture/CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md) (ADR 0012).

Priorizar mantenibilidad, arquitectura, código limpio y documentación sobre velocidad.

## Idioma (ADR 0010)

Documentación y razonamiento en **español**. Código y BD en **inglés**.

## Principio de Intencionalidad (ADR 0011)

> Todo elemento debe justificar su existencia **antes** de implementarse.

Registrar en el **Diario de Desarrollo** al terminar (antes de Done).

## Antes de escribir código

1. [`FOUNDATION.md`](./FOUNDATION.md)  
2. [`CONTEXTO_ESTRATEGICO_PERMANENTE.md`](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md)  
3. [`CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md)  
4. ADRs y docs del módulo  
5. Modelo de dominio (`docs/12-domain-model/module-01/` si Module 01)  
6. Código existente de Services/módulos  
7. Detectar inconsistencias docs ↔ código  
8. Solo entonces implementar  

**No rehacer Architecture Review ni Foundation** salvo ADR nuevo. Ya están cerrados (`v0.1.0`).

## Fase actual

```text
Foundation Lock ✅  →  Module 01 Dish Library 🚧
```

Orden: Dish → Ingredient → Recipe → Repos → Services → Rules → Tests → **UI** → CRUD.

## Gobierno

| Quién | Rol |
|-------|-----|
| **Cursor** | CTO — arquitectura, dominio, implementación |
| **`docs/` + ADRs** | Fuente de verdad |
| **Lovable** | UI / pantallas (no redefine arquitectura) |
| **Código** | Sigue a la documentación |

Conflictos con `.lovable/plan.md` → **gana `docs/`**.

## Reglas permanentes (extracto)

- Canónico: g, ml, km, °C, UTC, decimal  
- `useFmt()` — no `toLocaleString` en UI de producto  
- Multi-tenant + RLS  
- Capabilities (`useCan` / `requireCapability`)  
- UI → Service → Repository → Supabase  
- `archive` / `restore` / `purge` — nunca `delete()` de negocio  
- `DomainError` + `ServiceContext`  
- Tras v0.1.0: cambio arquitectónico = ADR  
- AI / offline: no implementar aún  
- Cierre de jornada incluye Diario  

## Enlaces

- [Contexto estratégico](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md)
- [Contexto CTO](./docs/05-architecture/CONTEXTO_CTO.md)
- [Diario](./docs/99-internal/development-journal/README.md)
- [DoD](./docs/00-status/DEFINITION_OF_DONE.md)
- [Dish](./docs/12-domain-model/module-01/Dish.md)
- [Architecture Review](./docs/05-architecture/architecture-review.md) (histórico — ya aprobado)
