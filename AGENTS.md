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

Priorizar **mantenibilidad, arquitectura, código limpio y documentación** sobre la velocidad.

## Idioma (ADR 0010)

- **Documentación y razonamiento:** español.
- **Código y base de datos:** inglés (`DishService`, `dishes`).
- **i18n de la app:** independiente (producto multilenguaje).

## Antes de escribir código

Actuar como arquitecto:

1. Revisar constitución (`docs/`)
2. Revisar ADRs
3. Revisar modelo de dominio y lenguaje ubicuo
4. Revisar servicios / módulos existentes
5. Detectar inconsistencias
6. Solo entonces implementar

## Gobierno

| Tema | Fuente de verdad |
|------|------------------|
| Arquitectura, dominio, schema, RBAC, roadmap | **`docs/` + ADRs + Cursor** |
| UI / flujos visuales | Lovable puede acelerar — debe seguir docs |
| Conflictos con `.lovable/plan.md` | **Gana `docs/`** |

## Fase actual

**`v0.1.0` FOUNDATION LOCKED** → **Module 01 — Dish Library**

La arquitectura ya no se diseña; **se aplica**. Todo cambio estructural → ADR.

Orden Module 01: Dish → Ingredient → Recipe → Repos → Services → Rules → Tests → **UI** → CRUD.

## Reglas permanentes

1. Almacenamiento canónico (g, ml, km, °C, UTC, decimal + ISO currency).
2. Nunca `toLocaleString()` en UI de producto — usar `useFmt()`.
3. Multi-tenant: `tenant_id` + RLS.
4. Capabilities (`useCan` / `requireCapability`), no roles crudos en features.
5. `UI → Service → Repository → Supabase`.
6. Soft delete: `archive` / `restore` / `purge` — nunca `delete()` de negocio.
7. `DomainError` tipado.
8. Un solo `ServiceContext`.
9. Módulos en `src/modules/<nombre>/{domain,application,infrastructure,presentation}`.
10. Tras `v0.1.0`, sin cambio arquitectónico sin ADR.
11. IA / offline: no implementar aún.

## Protocolos

- [Definition of Done](./docs/00-status/DEFINITION_OF_DONE.md)
- [Cierre de jornada](./docs/05-architecture/CIERRE_DE_JORNADA.md)
- [Foundation Lock](./docs/05-architecture/FOUNDATION_LOCK.md)
- [Module 01](./docs/12-domain-model/MODULE_01_DISH_LIBRARY.md)
