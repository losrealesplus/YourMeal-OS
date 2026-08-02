# RELEASE-01 · Beta Strategy

**Documento:** `RELEASE_01_BETA_STRATEGY.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DRAFT · Gate concept** (no es un Flow · no abre implementación)  
**Precondición:** FLOW-01…FLOW-03 ✅ CERTIFIED · FOPEBA institucionalizado  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Handoff:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md)

> Hasta ahora se certifican **flujos**.  
> El siguiente nivel es certificar el **producto como conjunto**  
> antes de declarar una beta usable por un cliente real.

---

## Etapas del repositorio (contexto)

| Etapa | Estado |
|-------|--------|
| Foundation | ✅ Cerrada |
| Platform Stabilization (PS-002-C) | ✅ Certificada · `ps002c-pass` |
| Business Flow Certification (FLOW-01 → FLOW-03) | ✅ En producción metodológica · `flow01/02/03-pass` |
| Product Release Governance (RELEASE-01) | 🚧 Iniciada · DoRl DRAFT |

---

## Dos preguntas (mantener separadas)

| Nivel | Pregunta |
|-------|----------|
| **Flow** | ¿Este flujo cumple su contrato? |
| **Release** | ¿El producto completo está listo para una beta? |

No sustituir una por la otra. Un Flow CERTIFIED no implica beta.  
Una beta BLOCKED no implica que un Flow falle.

---

## Dos ejes paralelos (siguiente fase)

### Eje A — Continuar certificando flujos

Patrón consolidado (sin saltos):

```text
FLOW-04
DoR → Spec → Freeze → Runner
→ FLOW04-001 → FLOW04-002 → …
→ flow04-pass
```

Luego FLOW-05 / FLOW-06 según catálogo, cada uno con el mismo ciclo.

**Intención de fase:** FLOW-04 como último gran cambio estructural del set beta;  
después, completar cobertura funcional con el proceso ya demostrado.

### Eje B — Construir el contrato RELEASE-01

Mientras se certifican Flows, completar el gate de producto:

```text
RELEASE-01

├── FOUNDATION              ✅
├── PS-002-C                ✅  tag ps002c-pass
├── FLOW-01                 ✅  tag flow01-pass
├── FLOW-02                 ✅  tag flow02-pass
├── FLOW-03                 ✅  tag flow03-pass
├── FLOW-04                 ⏳  Inventory (DoR → … → flow04-pass)
├── FLOW-05                 ⏳  (catálogo · DoR primero)
├── FLOW-06                 ⏳  (catálogo · DoR primero)
├── Smoke Tests             ⏳
├── Cross-flow Tests        ⏳
├── Performance             ⏳  (o N/A documentado)
├── Security                ⏳  (o N/A documentado)
├── Deployment              ⏳  reproducible
├── Documentation           ⏳  handoff · CURRENT_PHASE · ADRs
└── Beta Acceptance         ⏳  DoRl PASS
        ↓
   release-01-beta
```

Criterio de publicación: **todos los gates de Release aplicables certificados**,  
no “creemos que funciona”.

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

Freeze de DoRl RELEASE-01 = PR docs-only cuando el set de Flows beta esté cerrado.

---

## Criterios tentativos (aún no Freeze)

| # | Criterio | Notas |
|---|----------|-------|
| 1 | Flows críticos del piloto EatClean con tag `flowNN-pass` | Mínimo: catálogo priorizado |
| 2 | Integración entre flujos (estados de uno alimentan al siguiente) | Cross-flow + E2E |
| 3 | Experiencia cliente + ops + admin operable E2E | No solo dominio |
| 4 | Escenarios con datos reales / desviaciones nombradas | Fuera del happy path Spec |
| 5 | Roadmap y handoff actualizados | Sin PRs supersedidos abiertos |
| 6 | DoRl PASS | [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) |

---

## Relación con FLOW-04

FLOW-04 **no** se abre desde este documento.  
Arranca solo con DoR → Spec → Freeze → Runner (ver handoff).

Este Release Strategy contextualiza **por qué** el siguiente Flow importa para la beta  
y mantiene el eje B vivo en paralelo (docs / gates), sin mezclar dominio.

---

## Prohibido

- Declarar “beta ready” sin DoRl PASS  
- Mezclar implementación de producto en este doc  
- Saltar FOPEBA “porque ya vamos a beta”  
- Confundir `flowNN-pass` con `release-01-beta`

---

## Next

1. Merge docs close-out (#161 · handoff · RELEASE-01 · DoRl).  
2. **Eje A:** FLOW-04 DoR / Spec (sin dominio).  
3. **Eje B:** ir cerrando ítems DoRl documentales; Freeze cuando el set beta esté claro.  
4. Solo tras DoRl PASS → tag `release-01-beta`.
