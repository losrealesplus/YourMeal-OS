# Flow Catalog · EatClean

**Documento:** `FLOW_CATALOG.md`  
**Fecha:** 2026-08-02  
**Estado:** FLOW-01 ✅ · FLOW-02 ✅ · FLOW-03 ✅ · FLOW-04 ▶ Spec READY FOR FREEZE · DoR estándar ✅ (#147)  
**Piloto:** EatClean  
**Fase:** 1 · Domain / Flow (Fase 0 · Plataforma COMPLETE)  
**Plataforma:** PS-002-C ✅ · FCR-008 FROZEN · tag `ps002c-pass`  
**Dominio:** FLOW-01…03 ✅ `flow01-pass` · `flow02-pass` · `flow03-pass`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Regla de naming

```text
FLOW-NN
Source Journey / Workspace
    ↓
Target Journey / Workspace
```

No: “Mejoras de Delivery”.  
Sí: `FLOW-01 Kitchen → Delivery`.

---

## Certificados

| ID | Handoff | Pregunta operacional | Estado |
|----|---------|----------------------|--------|
| **FLOW-01** | Kitchen → Delivery | ¿Kitchen entrega correctamente a Delivery? | ✅ **CERTIFIED** · [SPEC](./FLOW_01_KITCHEN_DELIVERY_SPEC.md) · [Plan](./FLOW_01_DELIVERY_PLAN.md) · [PASS acta](../10-validation/flow-01/FLOW01_PASS_ACTA.md) · `npm run test:flow01-canonical -- --live` |
| **FLOW-02** | Delivery Incidents | ¿Un intento fallido queda operable y reintentable hasta `delivered`? | ✅ **CERTIFIED** · tag `flow02-pass` · [SPEC](./FLOW_02_DELIVERY_INCIDENTS_SPEC.md) · [PASS acta](../10-validation/flow-02/FLOW02_PASS_ACTA.md) · `npm run test:flow02-canonical -- --live` |
| **FLOW-03** | Billing | ¿Un pedido `delivered` queda facturable → revisado → cobrado? | ✅ **CERTIFIED** · tag `flow03-pass` → `67a2e66` · [SPEC](./FLOW_03_BILLING_SPEC.md) · [PASS acta](../10-validation/flow-03/FLOW03_PASS_ACTA.md) · `npm run test:flow03-canonical -- --live` |

---

## Activo / candidatos (sin Implementation hasta DoR completo)

| ID | Handoff / alcance | Prioridad | Motivo | Estado |
|----|-------------------|-----------|--------|--------|
| **FLOW-04** | Inventory Consumption | Alta | Consumo de ingredientes tras producción | ▶ **Spec READY FOR FREEZE** · [SPEC](./FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) · [DoR](./FLOW_04_INVENTORY_CONSUMPTION_DOR.md) · Runner ❌ |
| **FLOW-05** | Customer Order Lifecycle | Media | Creación del pedido → `confirmed` | ⏳ DoR NOT STARTED |
| **FLOW-06** | Kitchen Planning | Media | Planificación previa a T1 | ⏳ DoR NOT STARTED |

> Orden recomendado: cada Flow aprovecha el anterior sin mezclar responsabilidades.  
> Antes de Spec/código: completar [Definition of Ready](./FLOW_DEFINITION_OF_READY.md).

**Nota:** El catálogo inicial nombraba FLOW-02 Delivery→Support y FLOW-03 Support→Accounting.  
Los candidatos de la tabla superior son la **prioridad operativa EatClean** post–FLOW-01; Support/Accounting siguen elegibles vía Flow First cuando el piloto lo exija.

---

## Plantilla por Flow

1. **Definition of Ready** — checklist completo  
2. **Specification** — Outcomes · handoff · FAIL  
3. **Runner** — contrato `FLOWNN_*`  
4. **Implementation** — una transición / PR  
5. **Evidence → Certification → Acta**  

Jerarquía: [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md).

---

## Añadir un Flow

Solo si [FLOW_FIRST](./FLOW_FIRST.md) responde que la funcionalidad **debe** crear uno nuevo — y solo tras DoR.
