# RELEASE-01 · Beta Strategy

**Documento:** `RELEASE_01_BETA_STRATEGY.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DRAFT · Gate concept** (no es un Flow · no abre implementación de dominio)  
**Precondición:** FLOW-01…FLOW-04 ✅ CERTIFIED · FOPEBA institucionalizado · `flow04-pass`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
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

| Gate DoRl | Estado | Evidencia |
|-----------|--------|-----------|
| FOUNDATION | ✅ | Platform / foundation locks |
| PS-002C | ✅ | Tag `ps002c-pass` |
| FLOW-01 | ✅ | Tag `flow01-pass` |
| FLOW-02 | ✅ | Tag `flow02-pass` |
| FLOW-03 | ✅ | Tag `flow03-pass` |
| FLOW-04 | ✅ | Tag `flow04-pass` |
| Smoke Tests | ⏳ | Artefacto + comando / acta (por definir) |
| Cross-flow | ⏳ | Cadena multi-dominio (por definir) |
| E2E | ⏳ | Jornada piloto (por definir) |
| Deployment | ⏳ | Reproducible (por definir) |
| Rollback | ⏳ | Procedimiento + prueba (por definir) |
| Beta Acceptance | ⏳ | DoRl PASS → tag `release-01-beta` |

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
├── FLOW-05+                ⏳  solo si el set beta lo exige (DoR primero)
├── Smoke Tests             ⏳
├── Cross-flow Tests        ⏳
├── Performance             ⏳  (o N/A documentado)
├── Security                ⏳  (o N/A documentado)
├── Deployment              ⏳  reproducible
├── Rollback                ⏳
├── Documentation           ⏳  handoff · CURRENT_PHASE · ADRs
└── Beta Acceptance         ⏳  DoRl PASS
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
□ Smoke Tests PASS
□ Cross-flow PASS
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

1. **Eje B (prioridad):** definir artefactos Smoke / Cross-flow / E2E; ir cerrando filas ⏳ de la matriz.  
2. **Eje A:** FLOW-05 DoR only cuando sea bloqueador beta o el set Freeze lo exija.  
3. Congelar DoRl RELEASE-01 (docs-only) cuando set + gates estén claros.  
4. Solo tras DoRl PASS → tag `release-01-beta`.

---

## End of RELEASE-01 Beta Strategy
