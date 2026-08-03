# RELEASE-01 · Beta Strategy

**Documento:** `RELEASE_01_BETA_STRATEGY.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DRAFT · Gate concept** · Track B operativo ✅ · DoR Beta ✅ · Spec ✅ FROZEN · Runner ✅ · Gate ✅ READY · next BETA-001  
**Precondición:** FLOW-01…FLOW-04 ✅ · Track B Smoke…Rollback ✅ · `release-rollback-pass`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**DoR Beta:** [RELEASE_01_BETA_DOR](./RELEASE_01_BETA_DOR.md)  
**Spec Beta:** [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md)  
**Runner Beta:** [RELEASE_01_BETA_RUNNER](../10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Handoff:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md)

> Hasta FLOW-04 se certificaban **flujos** (¿podemos certificar un flujo?).  
> Con cuatro ciclos, esa pregunta ya tiene evidencia suficiente.  
> El siguiente nivel es certificar el **producto como conjunto**  
> antes de declarar una beta usable por un cliente real.

---

## Etapas del repositorio (contexto)

| Etapa | Estado |
|-------|--------|
| Foundation | ✅ Cerrada |
| Platform Stabilization (PS-002-C) | ✅ Certificada · `ps002c-pass` |
| Business Flow Certification (FLOW-01 → FLOW-04) | ✅ Cuatro ciclos · `flow01`…`flow04-pass` |
| Product Release Governance (RELEASE-01) | 🚧 Prioridad · DoRl DRAFT · matriz medible |

---

## Dos preguntas (mantener separadas)

| Nivel | Pregunta |
|-------|----------|
| **Flow** | ¿Este flujo cumple su contrato? |
| **Release** | ¿El producto completo está listo para una beta? |

No sustituir una por la otra. Un Flow CERTIFIED no implica beta.  
Una beta BLOCKED no implica que un Flow falle.

---

## Prioridad post–`flow04-pass`

**Track B (este documento / DoRl)** tiene prioridad ligeramente mayor que abrir FLOW-05.

FLOW-05 sigue el patrón FOPEBA sin excepciones **cuando se abra**;  
no se abre de inmediato salvo bloqueador directo de la beta.

---

## Dos ejes paralelos

### Eje A — Continuar certificando flujos (sin romper el patrón)

```text
FLOW-05 (cuando proceda)
DoR → Spec → Freeze → Runner
→ FLOW05-001 → …
→ flow05-pass
```

Luego FLOW-06… según catálogo. Sin saltos. Sin features futuras en el PR del Flow.

### Eje B — Acumular evidencia RELEASE-01 (prioridad ligeramente mayor)

#### Matriz DoRl (viva · medible)

| Gate DoRl | Estado | Evidencia / hito |
|-----------|--------|------------------|
| FOUNDATION | ✅ | Platform / foundation locks |
| PS-002C | ✅ | Tag `ps002c-pass` |
| FLOW-01 | ✅ | Tag `flow01-pass` |
| FLOW-02 | ✅ | Tag `flow02-pass` |
| FLOW-03 | ✅ | Tag `flow03-pass` |
| FLOW-04 | ✅ | Tag `flow04-pass` |
| Smoke Tests | ✅ | Tag `release-smoke-pass` · [PASS acta](../10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md) |
| Cross-flow | ✅ | Tag `release-crossflow-pass` → `0a0c51b` · [PASS](../10-validation/release-crossflow/RELEASE_CROSSFLOW_PASS_ACTA.md) |
| E2E | ✅ | Tag `release-e2e-pass` → `73623ae` · [PASS](../10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md) |
| Deployment | ✅ | Tag `release-deploy-pass` → `7896a2a` · [PASS](../10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md) |
| Rollback | ✅ | Tag `release-rollback-pass` → `0ba856e` · [PASS](../10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md) |
| Beta Acceptance | ▶ | Spec ✅ FROZEN · Runner ✅ · Gate ✅ READY · [GATE](../10-validation/release-01-beta/RELEASE_01_BETA_GATE.md) → tag `release-01-beta` |

#### Roadmap Track B (mismo patrón FOPEBA · sin mezclar)

```text
B-01 Smoke        ✅ release-smoke-pass
B-02 Cross-flow   ✅ release-crossflow-pass → 0a0c51b
B-03 E2E          ✅ release-e2e-pass → 73623ae
B-04 Deployment   ✅ release-deploy-pass → 7896a2a
B-05 Rollback     ✅ release-rollback-pass → 0ba856e
B-06 Beta Accept. DoR ✅ · Spec ✅ FROZEN · Runner ✅ · Gate ✅ READY → OPEN 001 → release-01-beta
```

Orden fijo. **No** abrir FLOW-05 hasta existir `release-01-beta`.  
Convención de tags: homogénea con `flowNN-pass` — cada gate termina en `-pass` / `release-01-beta`.

Criterio de publicación: **todos los gates aplicables con evidencia**,  
no “creemos que funciona”.

Árbol de composición (referencia):

```text
RELEASE-01

├── FOUNDATION              ✅
├── PS-002-C                ✅  tag ps002c-pass
├── FLOW-01                 ✅  tag flow01-pass
├── FLOW-02                 ✅  tag flow02-pass
├── FLOW-03                 ✅  tag flow03-pass
├── FLOW-04                 ✅  tag flow04-pass
├── FLOW-05+                ⏳  CLOSED hasta release-01-beta
├── Smoke Tests             ✅  tag release-smoke-pass
├── Cross-flow Tests        ✅  tag release-crossflow-pass → 0a0c51b
├── E2E Tests               ✅  tag release-e2e-pass → 73623ae
├── Performance             ⏳  (o N/A documentado)
├── Security                ⏳  (o N/A documentado)
├── Deployment              ✅  tag release-deploy-pass → 7896a2a
├── Rollback                ✅  tag release-rollback-pass → 0ba856e
├── Documentation           ✅  Spec Beta FROZEN
└── Beta Acceptance         ▶  Runner ▶ BLOCKED at B1
        ↓
   release-01-beta
```

---

## Cross-flow (complementa runners; no los sustituye)

Hasta FLOW-04 cada Flow se certificó de forma aislada.  
A medida que crece la cobertura, el riesgo dominante pasa a ser la **interacción**:

```text
Pedido
  ↓
Producción
  ↓
Packaging
  ↓
Entrega
  ↓
Incidencia
  ↓
Facturación
  ↓
Inventario
  ↓
Cierre
```

- Runners canónicos → contrato individual  
- Cross-flow / E2E → contratos encadenados  

Ambos son necesarios para DoRl PASS.

---

## Definition of Release (DoRl) · RELEASE-01

Checklist canónica: [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md).

Instancia RELEASE-01 (aún no Freeze):

```text
RELEASE-01
□ DoRl documentado
□ FLOW requeridos con tag flowNN-pass (set beta — por congelar)
□ Sin PR abiertos de dominio incompletos del set
☑ Smoke Tests PASS
☑ Cross-flow PASS
□ E2E PASS
□ Performance / Security (PASS o N/A documentado)
□ Deployment reproducible · Rollback validado
□ Documentación + ADRs sincronizados
□ Tags remotos · CHANGELOG cerrado
        ↓
   DoRl PASS → tag release-01-beta
```

Freeze de DoRl RELEASE-01 = PR docs-only cuando el set de Flows beta y los  
gates de producto estén cerrados en documento.

---

## Criterios tentativos (aún no Freeze)

| # | Criterio | Notas |
|---|----------|-------|
| 1 | Flows críticos del piloto EatClean con tag `flowNN-pass` | Mínimo: catálogo priorizado · FLOW-01…04 ✅ |
| 2 | Integración entre flujos (estados de uno alimentan al siguiente) | Cross-flow + E2E |
| 3 | Experiencia cliente + ops + admin operable E2E | No solo dominio |
| 4 | Escenarios con datos reales / desviaciones nombradas | Fuera del happy path Spec |
| 5 | Roadmap y handoff actualizados | Sin PRs supersedidos abiertos |
| 6 | DoRl PASS | [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) |

---

## Relación con FLOW-05+

FLOW-05+ **no** se abren desde este documento.  
Arrancan solo con DoR → Spec → Freeze → Runner.

Este Release Strategy fija **por qué** Track B acumula evidencia ahora  
y cuándo un Flow adicional es bloqueador de beta (no “por inercia del catálogo”).

---

## Prohibido

- Declarar “beta ready” sin DoRl PASS  
- Mezclar implementación de dominio de Flow en PRs de Release  
- Saltar FOPEBA “porque ya vamos a beta”  
- Confundir `flowNN-pass` con `release-01-beta`  
- Abrir FLOW-05 solo por momentum tras `flow04-pass`

---

## Next

1. **B-01:** Spec FROZEN · Runner `test:release-smoke` → BLOCKED → Gate → RELEASE-SMOKE-001… → `release-smoke-pass`.  
2. **B-02…B-06:** mismo patrón; Beta Acceptance solo al final.  
3. **Eje A:** Do NOT open FLOW-05 unless Track B discovers a blocker that requires it.  
4. Solo tras DoRl PASS → tag `release-01-beta`.

---

## End of RELEASE-01 Beta Strategy
