# PR Taxonomy

**Documento:** `PR_TAXONOMY.md`  
**Fecha:** 2026-07-29  
**Estado:** Active  
**Aplica desde:** [PLATFORM_BASELINE_v1](./PLATFORM_BASELINE_v1.md) · [PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md)

---

## Regla

Toda Pull Request debe pertenecer a **exactamente una** de estas categorías:

| # | Categoría | Uso |
|---|-----------|-----|
| 1 | **Flow Certification** | Handoffs · evidencia Flow · Bloque G · plantillas Flow |
| 2 | **Operational Module** | Módulo de negocio que **consume** el Core (Kitchen, Orders, …) |
| 3 | **Operational Service** | Servicio transversal post-necesidad (Event Bus, Notifications, Jobs, …) |
| 4 | **Bug Fix** | Corrección con causa raíz; no rediseño de Core |
| 5 | **Documentation** | Docs de Flow / módulos / evidencia; no nuevos docs constitucionales del Core |

---

## Categorías prohibidas (ambiguas)

| ❌ Rechazar | Por qué |
|------------|---------|
| Refactor general | Sin objetivo de certificación ni módulo |
| Mejoras varias | Mezcla cambios sin categoría única |
| Cleanup / chore sin alcance | Debe mapear a Bug Fix o Documentation con motivo |
| “Platform improvements” | Platform v1 CLOSED — usar CHANGE_AUTHORITY si evidencia |

---

## Checklist en el PR

La plantilla `.github/pull_request_template.md` exige declarar la categoría.

Además:

1. ¿Respeta la Baseline?  
2. ¿Respeta el Core / Contract?  
3. ¿Produce evidencia operacional?  
4. ¿Acerca Flow a certificación? *(o N/A justificado para Module/Service/Bug/Docs)*  

---

## Título sugerido

```text
[Flow] …
[Module] …
[Service] …
[Bugfix] …
[Docs] …
```
