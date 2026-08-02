# Flow Catalog · EatClean (initial)

**Documento:** `FLOW_CATALOG.md`  
**Fecha:** 2026-07-29  
**Estado:** Draft catalog · FLOW-01 Spec ✅ **FROZEN** · Runner ▶  
**Piloto:** EatClean  
**Fase:** 1 · Domain / Flow (Fase 0 · Plataforma COMPLETE)  
**Plataforma:** PS-002-C ✅ PASS · tag `ps002c-pass` · FCR-008 FROZEN  
**Framing:** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md) · [FLOW_01 Spec](./FLOW_01_KITCHEN_DELIVERY_SPEC.md)

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

**Épicas futuras** se nombran y organizan por Flow (no por módulo): Spec → Implementation → Evidence → Certification — [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md).

---

## Catálogo inicial (propuesto)

| ID | Handoff | Pregunta operacional | Estado |
|----|---------|----------------------|--------|
| **FLOW-01** | Kitchen → Delivery | ¿Kitchen entrega correctamente a Delivery? | ✅ Spec · ✅ Runner · ✅ T1 · ✅ T2 · ▶ **T3 PASS** (BLOCKED at T4) · [SPEC](./FLOW_01_KITCHEN_DELIVERY_SPEC.md) · [Plan](./FLOW_01_DELIVERY_PLAN.md) |
| **FLOW-02** | Delivery → Support | ¿Delivery deja a Support con contexto usable? | ⏳ NOT STARTED |
| **FLOW-03** | Support → Accounting | ¿Support cierra hacia registros financieros coherentes? | ⏳ NOT STARTED |

> Lista **inicial** alineada a Journeys certificados (Kitchen · Delivery · Support · Accounting).  
> Ampliar solo con Flow First: ¿pertenece a un Flow? ¿hace falta uno nuevo?

---

## Plantilla por Flow

Para cada FLOW-NN:

1. **Specification** — Outcomes A/B · handoff · criterios FAIL  
2. **Execution** — cómo ocurre el traspaso en YM OS  
3. **Evidence** — evidencia reproducible  
4. **Certification** — veredicto  
5. Contribuye a **Operational Readiness** cuando el conjunto E2E esté listo  

Jerarquía: [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md).

---

## Añadir un Flow

Solo si [FLOW_FIRST](./FLOW_FIRST.md) responde que la funcionalidad **debe** crear uno nuevo — con Outcome A/B certificados o elegibles.
