# Definition of Release (DoRl)

**Documento:** `DEFINITION_OF_RELEASE.md`  
**Fecha:** 2026-08-02  
**Status:** ▶ **DRAFT · Estándar de producto** (no abre implementación de dominio)  
**Nivel:** Producto / versión — **no** es un Flow  
**Complementa:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md) · [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Handoff:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md)

> DoR responde: *¿este Flow puede empezar a implementarse?*  
> DoRl responde: *¿esta versión del producto puede etiquetarse y publicarse?*  
> Post–`flow04-pass`: la segunda pregunta empieza a dominar el plan (Track B).

Son preguntas distintas. No mezclar.

---

## Propósito

Convertir una **release** (p. ej. beta) en un **artefacto certificable**,
con la misma disciplina que un Flow: checklist → evidencia → tag.

FOPEBA ya cubre el ciclo de Flow:

```text
Evidence Before Implementation
→ Definition of Ready (DoR)
→ Specification → Freeze → Runner
→ Implementation → Certification → Tag (flowNN-pass)
```

**Definition of Release (DoRl)** es la pieza que falta encima:

```text
Flows requeridos certificados (flowNN-pass)
→ Gates de producto (smoke · cross-flow · E2E · …)
→ DoRl PASS
→ Tag de release (release-01-beta · release-vX.Y.Z)
```

---

## Dos preguntas, dos ejes

| Eje | Pregunta | Artefacto | Tag |
|-----|----------|-----------|-----|
| **A · Flow** | ¿Este flujo cumple su contrato? | Spec + runner + acta | `flowNN-pass` |
| **B · Release** | ¿El producto completo está listo para esta versión? | DoRl + acta de release | `release-*-beta` / `release-vX.Y.Z` |

El eje A sigue FOPEBA sin atajos.  
El eje B **no** sustituye FOPEBA: exige que los Flows del set de release estén certificados.

---

## Definition of Release · checklist (plantilla)

Para cada `RELEASE-XX` (primera instancia: RELEASE-01 Beta):

```text
RELEASE-XX
□ Definition of Release documentado (este estándar + checklist de la release)
□ Todos los FLOW requeridos certificados (tags flowNN-pass en main)
□ Sin PR abiertos de dominio supersedidos / incompletos del set de release
□ Smoke Tests PASS
□ Cross-flow Tests PASS
□ E2E Certification PASS (jornada piloto)
□ Performance (umbrales acordados · o “N/A documentado”)
□ Security (checklist piloto · o “N/A documentado”)
□ Deployment reproducible
□ Rollback validado (o procedimiento documentado + prueba)
□ Documentación actualizada (CURRENT_PHASE · handoff · catálogo)
□ ADRs sincronizados con el comportamiento certificado
□ Tags de Flow / plataforma creados en remoto
□ CHANGELOG cerrado para la versión
        ↓
   DoRl PASS
        ↓
   tag: release-XX-…  (p. ej. release-01-beta)
```

Sin todos los ítems aplicables → ❌ no declarar beta / no crear tag de release.

Los ítems “N/A documentado” deben citar el doc que justifica la exclusión (no silencio).

---

## Semántica

| Estado | Significa |
|--------|-----------|
| **DoRl DRAFT** | Checklist y composición de release en definición |
| **DoRl FROZEN** | Set de Flows + gates de producto congelados para esa release |
| **DoRl PASS** | Todos los ítems aplicables verificados con evidencia |
| **DoRl BLOCKED** | Falta un Flow o un gate de producto (no es defecto de un Flow) |

**BLOCKED** en DoRl ≠ FAIL de un Flow.  
Un Flow puede estar CERTIFIED y la Release seguir BLOCKED por E2E o documentación.

---

## Relación con FLOW-04+ (post–`flow04-pass`)

Con FLOW-01…04 certificados, la metodología de Flow ya tiene evidencia suficiente.  
DoRl pasa a ser el instrumento para evaluar el **producto como sistema**.

- FLOW-05+ siguen **DoR → Spec → Freeze → Runner → T1… → flowNN-pass** (sin excepciones).  
- Completar Flows **alimenta** el eje B; no “abre” la beta por sí solo.  
- Declarar `release-01-beta` exige **DoRl PASS**, no solo el último `flowNN-pass`.  
- Abrir el siguiente Flow solo si alimenta / desbloquea la beta — no por inercia.

### Matriz medible (instancia RELEASE-01)

La conversación sobre beta se ancla a filas con evidencia (detalle vivo en  
[RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)):

| Gate DoRl | Estado típico post–FLOW-04 | Hito |
|-----------|----------------------------|------|
| FOUNDATION · PS-002C · FLOW-01…04 | ✅ | Tags de milestone |
| Smoke | ✅ | `release-smoke-pass` → `370628a` |
| Cross-flow | ✅ | `release-crossflow-pass` → `0a0c51b` · [PASS](../10-validation/release-crossflow/RELEASE_CROSSFLOW_PASS_ACTA.md) |
| E2E | ✅ [PASS acta](../10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md) · `73623ae` | `release-e2e-pass` |
| Deployment · Rollback | ▶ Deploy Spec · [RELEASE_DEPLOY_SPEC](./RELEASE_DEPLOY_SPEC.md) | `release-deploy-pass` · `release-rollback-pass` |
| Beta Acceptance | ⏳ | `release-01-beta` |

Cada gate Track B sigue Spec → Freeze → Runner (BLOCKED) → impl → `-pass`.  
Cross-flow complementa runners canónicos; no los sustituye.

**Regla de nivel:** runners de Release certifican **capacidades de plataforma**  
(`preflight`, `auth`, `bootstrap`, `dashboard`, `deploy`, `rollback`, …).  
Runners de Flow certifican **entidades / estados de dominio**. No mezclar.

**Regla de Gate (Regla 9):** un Gate nunca se cierra porque un PR pase;  
solo cuando el comportamiento esperado se verifica desde `main`.  
Procedimiento: [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md).  
Ejemplo vivo: [RELEASE_SMOKE_GATE](../10-validation/release-smoke/RELEASE_SMOKE_GATE.md) ✅ READY.

---

## Prohibido

- Usar DoRl para saltarse DoR / Spec / Runner de un Flow  
- Mezclar PRs de dominio de Flow con cierre de Release  
- Declarar “beta ready” por intuición o por número de PRs mergeados  
- Congelar DoRl de RELEASE-01 antes de cerrar el set de Flows críticos (aún DRAFT)  
- Tratar `flowNN-pass` como equivalente a `release-01-beta`

---

## Primera aplicación

| Release | Doc de estrategia | Estado DoRl |
|---------|-------------------|-------------|
| RELEASE-01 (Beta) | [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) | ▶ DRAFT · matriz medible · no Freeze |

Freeze de DoRl para RELEASE-01 = cuando el set de Flows beta y los gates de producto estén cerrados en documento (PR docs-only).

---

## End of Definition of Release
