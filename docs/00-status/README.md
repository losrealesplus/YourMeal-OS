# Estado del proyecto

**Última actualización:** 2026-07-21  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  
**Hito histórico:** **Foundation Validation ✅**  
**Acta:** [MILESTONE_VALIDACION_DOMINIO_DISH.md](./MILESTONE_VALIDACION_DOMINIO_DISH.md)

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

> Aquí dejó de construirse la **metodología** y empezó a construirse el **producto**.  
> Las siguientes entidades heredan el patrón; no lo reinventan.

## Fase oficial

```text
FASE 0 — FUNDACIÓN                 ✅ validada
FASE 1 — Core v0.1 (EatClean)      🚧
Module 01 · Dish Library
  Domain Done (Dish)               ✅
  Repository Interface             ⏳  ← siguiente
  Application / Infra / UI         ⏳
```

### Cambio de naturaleza del proyecto

| Hasta Foundation Validation | A partir de ahora |
|-----------------------------|-------------------|
| ¿Cómo queremos construir? | ¿Qué necesita realmente una cocina? |
| ¿Qué reglas tendrá el Core? | ¿Cómo modelamos producción, inventario, pedidos? |
| ¿Cómo modelamos una entidad? | Materializar negocio con metodología ya demostrada |

Foco: del **metamodelo** al **dominio del negocio**.

## Constitución (resumen)

| Pilar | Principio |
|-------|-----------|
| Arquitectura | Docs + ADRs son la fuente de verdad; **Cursor = CTO**; Lovable = UI |
| Desarrollo | Español en docs/razonamiento; inglés en código/BD |
| Calidad | Intencionalidad + Definition of Done + Domain Done |
| Memoria | Diario de Desarrollo del Proyecto |
| Foundation | Documento **vivo**; validado, no «cerrado para siempre» |
| Domain Done | [DOMAIN_DONE.md](../12-domain-model/DOMAIN_DONE.md) |
| Entity Guidelines | [ENTITY_GUIDELINES.md](../12-domain-model/ENTITY_GUIDELINES.md) |

## Module 01 — ahora

**Dish:** Domain Done — no ampliar comportamiento (evitar superentidad).

**Próximo paso:** Repository Interface  
Documentar contrato → interface → sin reglas de negocio → independiente de Supabase/ORM.

## Misión v0.1

> Construir la mejor plataforma posible para EatClean y convertir cada aprendizaje real en una capacidad reusable del Core.

## Enlaces

- [Milestone · Foundation Validation](./MILESTONE_VALIDACION_DOMINIO_DISH.md)
- [Domain Done](../12-domain-model/DOMAIN_DONE.md)
- [Roadmap](../roadmap/README.md)
- [Diario](../99-internal/development-journal/README.md)
- [Definition of Done](./DEFINITION_OF_DONE.md)
