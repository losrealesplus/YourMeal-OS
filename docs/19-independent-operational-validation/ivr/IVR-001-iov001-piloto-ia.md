# IVR-001 — IOV-001 Piloto IA (Comprehension)

**Nivel:** IOV-001  
**Evaluador:** Piloto IA ciego (sesión nueva · sin memoria de proyecto)  
**KCM:** [KCM-001](../kcm/KCM-001-iov001-pilot.md) · commit corpus `357833e`  
**Escenario:** [SC-IOV-001](../scenarios/SC-IOV-001-pedido-semana.md)  
**Fecha:** 2026-07-22  
**Autores:** silencio  

**Readiness Review (interno):** ¿demostrar que funciona o descubrir por qué falla? → **descubrir fallos** (protocolo + corpus).

---

## Objetivo del piloto

Validar:

1. ¿El corpus es suficiente?  
2. ¿El protocolo funciona?  
3. ¿La clasificación DF produce evidencia útil?

---

## Resultado ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Corpus suficiente para narrar SC-IOV-001? | **Sí** (5/5 pasos) |
| ¿Protocolo usable? | **Sí** (citas · evidencia negativa · confianza · Findings) |
| ¿IFD (Impossible)? | **0** |
| ¿VR/MC inmediato? | **No** — Findings → docs / Classification |
| Confianza evaluador | **78%** |
| Calibración | Sana (dudas alineadas con Gaps reales; no falsa claridad 100%) |

---

## Transferability Score

| Dimensión | % | Notas |
|-----------|---|-------|
| Comprensión | **91** | Narró espina completa con objetos canónicos |
| Interpretación | **88** | Verbos y estados mayormente correctos |
| Consistencia | **90** | Relato interno coherente (INV-021 respetado) |
| Ambigüedad | **12** | F1 · F4 · F7 |
| Información perdida | **8** | F2 · F5 · F6 (máquinas de estado incompletas en un solo sitio) |

*(Ambigüedad e información perdida: menor = mejor.)*

---

## Evidencia negativa (aciertos sin fricción)

El evaluador resolvió **sin dudar**:

- ✓ B2B: Organization · Company Account · Beneficiary  
- ✓ Order Draft → Confirmed · `contributes to` Plan · INV-023  
- ✓ Plan Finalize/Start · Batch → Packaging  
- ✓ Label / destinatario en Packaging Complete · INV-035  
- ✓ Packaging → Route → Delivery confirms  
- ✓ Payment `settles` Order · puede no ser inmediato · INV-024  
- ✓ Espina canónica Menu → … → Payment  

---

## Findings clasificados

| ID | Tipo | Classification | ¿VR? | Seguimiento |
|----|------|----------------|------|-------------|
| [DF-001](../04-findings/documentation-findings.md#df-001) | Ambiguity | Valorar docs (quién `places` B2B) | No ahora | Docs UL/spine |
| [DF-002](../04-findings/documentation-findings.md#df-002) | Gap | Docs only | No | Completar transiciones Payment |
| [DF-003](../04-findings/documentation-findings.md#df-003) | Implicit assumption | Docs only | No | Order Item → Plan del día |
| [DF-004](../04-findings/documentation-findings.md#df-004) | Ambiguity | Docs only | No | `produces` vs `packages into` |
| [DF-005](../04-findings/documentation-findings.md#df-005) | Gap | Docs only | No | Delivery Pending → Attempted |
| [DF-006](../04-findings/documentation-findings.md#df-006) | Missing cross-link | Docs only | No | Finance UL ↔ Settle ↔ Invoice |
| [DF-007](../04-findings/documentation-findings.md#df-007) | Ambiguity | Docs only | No | Cardinalidad día vs semana |
| [DF-008](../04-findings/documentation-findings.md#df-008) | Navigation | Docs only | No | Índice de recorrido Happy Path |
| [DF-009](../04-findings/documentation-findings.md#df-009) | Implicit assumption | Docs only | No | Label en narración Packaging |

**IFD:** ninguno.

---

## Mejoras documentales (lista — no MC)

1. Transiciones Payment faltantes en `spine-transitions` (Due / Pending at delivery / Captured / Failed).  
2. Transición explícita Delivery `Pending` → `Attempted`.  
3. Mini-guía «Happy Path B2B en 1 página» (navegación).  
4. Aclarar quién `places` vs quién confirma (admin Organization).  
5. Nota Order Item (día) → agregación en Plan del día.  
6. Unificar verbo Packaging (`produces` canónico en Happy Path).  
7. Cross-link finance → Settle para B2B factura.  

Aplicar en commit de docs **después** de este IVR (ajuste de corpus → nuevo KCM si se repite IOV-001 humano).

---

## Decisión de campaña

| Siguiente | Acción |
|-----------|--------|
| Ahora | Aplicar mejoras docs P0 de la lista (Payment · Delivery · happy-path index) |
| Luego | **IOV-002** (no abrir FOV) |
| Humano IOV-001 | Opcional tras docs + KCM-002, o diferir si piloto + IOV-002 bastan para confianza de protocolo |

**FOV permanece cerrado** hasta IOV-001…003 + RC — [06 Campaign Order](../06-campaign-order.md).

---

## Relacionado

- Narrativa cruda del evaluador: sesión agente `cbd06e23-e1ae-48d6-9d84-80c204fc856f`  
- [05 Experimental Protocol](../05-experimental-protocol.md)
