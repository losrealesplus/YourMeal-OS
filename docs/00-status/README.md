# Estado del proyecto

**Última actualización:** 2026-07-21  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  
**Metodología:** **estable** — ya no se profundizan cimientos; se construye producto  
**Hito histórico:** **Foundation Validation ✅**  
**Acta:** [MILESTONE_VALIDACION_DOMINIO_DISH.md](./MILESTONE_VALIDACION_DOMINIO_DISH.md)  
**Registro:** [metodología estable](../99-internal/development-journal/2026-07-21-metodologia-estable-primera-planta.md)

## Milestones

| Milestone | Estado |
|-----------|--------|
| Blueprint | ✅ |
| Foundation | ✅ *(documento vivo)* |
| Foundation Lock | ✅ |
| Product Philosophy | ✅ |
| Ubiquitous Language | ✅ |
| ACTORS | ✅ |
| ENTITY_GUIDELINES | ✅ |
| DOMAIN_DONE | ✅ |
| Primera entidad (`Dish`) | ✅ |
| Validación de la metodología | ✅ |
| **Foundation Validation** | ✅ |
| **Metodología estable** | ✅ |
| **UC-001 CreateDishUseCase** | ✅ |
| **Dish Management (UC-001…008)** | ✅ |
| SupabaseDishRepository / UI | ⏳ |

> Por debajo de Foundation no quedan decisiones arquitectónicas pendientes.  
> Lo que sigue son implementaciones.  
> Respuesta preferida ante un doc nuevo: *«¿Foundation ya responde?»* / *«¿El producto lo necesita?»*

## Fase oficial

```text
FASE 0 — FUNDACIÓN                 ✅ estable
FASE 1 — Core v0.1 (EatClean)      🚧 ingeniería

Platform: YourMeal OS
Capability: Dish Management
  Domain (Dish)                    ✅
  Repository (contrato)            ✅
  Use Cases UC-001…008             ✅  ← Application Done
  Infrastructure (Supabase)        ⏳
  UI MVP                           ⏳
```

**Hecho:** capacidad **Dish Management** en Application — ocho Use Cases + tests (40), sin infraestructura.  
**Vocabulario:** planificar por Capabilities, no por «módulos» de valor.  
**Disciplina:** primero evidencia; después abstracción.

**Próximo paso:** `SupabaseDishRepository` (adaptador) o UI — sin tocar Foundation. Sin generalizar Use Cases.

## Misión v0.1

> Construir la mejor plataforma posible para EatClean y convertir cada aprendizaje real en una capacidad reusable del Core.

## Enlaces

- [Diario · Capabilities](../99-internal/development-journal/2026-07-21-capabilities-jerarquia-planificacion.md)
- [Milestone · Foundation Validation](./MILESTONE_VALIDACION_DOMINIO_DISH.md)
- [Domain Done](../12-domain-model/DOMAIN_DONE.md)
- [DISH_USE_CASES](../14-application/DISH_USE_CASES.md)
- [CreateDishUseCase (diseño)](../14-application/use-cases/CreateDishUseCase.md)
- [Roadmap](../roadmap/README.md)
- [Diario](../99-internal/development-journal/README.md)
- [Definition of Done](./DEFINITION_OF_DONE.md)
