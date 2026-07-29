# Flow · Work Hierarchy

**Documento:** `FLOW_WORK_HIERARCHY.md`  
**Fecha:** 2026-07-29  
**Estado:** Active  
**Regla:** no mezclar conceptos entre niveles.

---

## Jerarquía única

```text
Flow
    ↓
Flow Specification
    ↓
Flow Execution
    ↓
Flow Evidence
    ↓
Flow Certification
    ↓
Operational Readiness
```

| Nivel | Qué es | Qué no es |
|-------|--------|-----------|
| **Flow** | Identidad del handoff (p. ej. FLOW-01) | Un módulo o pantalla |
| **Specification** | Contrato del handoff · Outcomes A/B · criterios | Implementación UI |
| **Execution** | Cómo ocurre el traspaso en el sistema | Certificación |
| **Evidence** | Prueba reproducible del handoff | Screenshot decorativo |
| **Certification** | Veredicto CERTIFIED / FAIL / OBSERVATIONS | “Feature mergeada” |
| **Operational Readiness** | Agregado post-Flows (empresa E2E) | Un solo departamento |

---

## Prohibido mezclar

| ❌ | ✅ |
|---|-----|
| PR “Mejoras de Delivery” | PR `[Flow] FLOW-01 Kitchen → Delivery` |
| Spec + UI + cert en un solo commit sin evidencia | Spec → Execution → Evidence → Certification |
| Certificar componente | Certificar handoff |

---

## Lenguaje del repositorio

Todo habla de **operación**:

```text
FLOW-01  Kitchen → Delivery
FLOW-02  Delivery → Support
FLOW-03  Support → Accounting
```

Ver [FLOW_CATALOG](./FLOW_CATALOG.md).  
Política permanente: [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md).
