# RELEASE-01 · Beta Strategy

**Documento:** `RELEASE_01_BETA_STRATEGY.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DRAFT · Gate concept** (no es un Flow · no abre implementación)  
**Precondición:** FLOW-01…FLOW-03 ✅ CERTIFIED · FOPEBA institucionalizado  
**Handoff:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md)

> Hasta ahora se certifican **flujos**.  
> El siguiente nivel es certificar el **producto como conjunto**  
> antes de declarar una beta usable por un cliente real.

---

## Pregunta de Release

> ¿El producto está suficientemente completo y trazable  
> para que un cliente piloto lo use de extremo a extremo,  
> con evidencia — no con intuición?

No: *¿tenemos muchas features?*  
Sí: *¿cada flujo crítico está certificado y el E2E piloto cierra?*

---

## Composición propuesta

```text
RELEASE-01 (Beta)

├── FOUNDATION              ✅
├── PS-002-C                ✅  tag ps002c-pass
├── FLOW-01                 ✅  tag flow01-pass
├── FLOW-02                 ✅  tag flow02-pass
├── FLOW-03                 ✅  tag flow03-pass
├── FLOW-04                 ⏳  Inventory (DoR → … → flow04-pass)
├── FLOW-05                 ⏳  (según catálogo · DoR primero)
├── FLOW-06                 ⏳  (según catálogo · DoR primero)
└── E2E Certification       ⏳  jornada piloto extremo a extremo
        ↓
   BETA READY
        ↓
   tag: release-01-beta  (o release-vX.Y.Z)
```

Los FLOW-* siguen FOPEBA.  
**RELEASE-01** no sustituye FOPEBA: es el **gate de producto** encima.

---

## Criterios tentativos (aún no Freeze)

| # | Criterio | Notas |
|---|----------|-------|
| 1 | Flows críticos del piloto EatClean con tag `flowNN-pass` | Mínimo: los del catálogo priorizado |
| 2 | Integración entre flujos (estados de uno alimentan al siguiente) | Evidencia / acta E2E |
| 3 | Experiencia cliente + ops + admin operable E2E | No solo dominio |
| 4 | Escenarios con datos reales / desviaciones nombradas | Fuera del happy path Spec |
| 5 | Roadmap y handoff actualizados | Sin PRs supersedidos abiertos |

Freeze de RELEASE-01 = documento aparte cuando el catálogo de Flows para beta esté cerrado.

---

## Relación con FLOW-04

FLOW-04 **no** se abre desde este documento.  
Arranca solo con DoR → Spec → Freeze → Runner (ver handoff).

Este Release Strategy solo contextualiza **por qué** el siguiente Flow importa para la beta.

---

## Prohibido

- Declarar “beta ready” sin gate RELEASE-01  
- Mezclar implementación de producto en este doc  
- Saltar FOPEBA “porque ya vamos a beta”

---

## Next

1. Merge docs close-out (#161 + este handoff/release).  
2. FLOW-04 DoR / Spec (sin dominio).  
3. Cuando el set de Flows beta esté claro → Freeze de RELEASE-01.  
