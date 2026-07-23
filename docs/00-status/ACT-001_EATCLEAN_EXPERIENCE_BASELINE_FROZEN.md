# ACT-001 · EatClean Experience Baseline Frozen

**Fecha:** 2026-07-23  
**Nivel:** Decision (gobernanza de experiencia Tenant)  
**Estado:** **Cerrada** / Frozen  
**Knowledge Lifetime:** Iteration *(acta inmutable al cierre)*  
**Bloque metodológico:** PR #24 → #30  
**No es:** un ADR · evolución del framework FOPEBA · permiso para pulir UI

---

## Decisión

Queda **congelada** la experiencia base de EatClean.

Incluye:

- Branding (logo · paleta · tipografía · fotografía · Powered by)
- Login
- Customer Home
- Weekly Menu
- Order Summary
- Centro de Operaciones
- Navegación principal (Customer App · shell Operaciones)

A partir de este momento:

```text
❌ No se aceptan cambios estéticos por preferencia.
```

Solo podrán modificarse mediante:

- evidencia FOV;
- evidencia operacional;
- hallazgos de piloto;
- decisión metodológica documentada.

---

## Por qué

Los PR **#24–#30** ya no son cambios aislados. Forman un **bloque metodológico** de gobernanza YourMeal OS:

| PR | Resultado |
|----|-----------|
| #24 | Tenant Experience |
| #25 | ADR-0014 · Customer Application is Tenant-Branded |
| #26 | Experience Refactor |
| #27 | Weekly Menu Experience |
| #28 | Login Experience |
| #29 | Centro de Operaciones + OJ |
| #30 | Brand Continuity Lock · Knowledge Lifetime · Pilot Ready |

Eso establece una forma consistente de materializar la identidad de un tenant **sin** romper la arquitectura SaaS ni FOPEBA.

Congelar evita el *endless polishing* — el siguiente valor no es otra iteración visual, es el [piloto E2E](./MILESTONE_EATCLEAN_PILOT_READY.md).

---

## Artefactos canónicos (lectura, no reescritura estética)

| Nivel | Doc |
|-------|-----|
| Contract | [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md) |
| Implementation | [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · [EATCLEAN_BRAND_CONTINUITY_LOCKED](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md) |
| Iteration | [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md) |

Filtro permanente: [Brand Recognition Filter](../05-architecture/TENANT_EXPERIENCE_SPEC.md#principio-rector--brand-recognition-filter-no-negociable).

---

## Qué sí se puede hacer sin “descongelar” estética

- Contenido vivo (menú real · fotos · macros · promociones) vía Tenant Assets  
- Entregables del milestone Pilot Ready (**EP-001…EP-005**)  
- Smoke · ORR · FOV · evidencia  
- Correcciones de bug / bloqueo demostrable  

---

## Relacionado

- [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md)  
- [CURRENT_PHASE](./CURRENT_PHASE.md) · [MILESTONES](./MILESTONES.md)  
- [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md)  
- Hipótesis (no oficial): [Brand Journey](../07-experience/BRAND_JOURNEY_HYPOTHESIS.md)
