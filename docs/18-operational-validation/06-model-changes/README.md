# 06 · Model Changes

**Regla innegociable:**

> **Ningún cambio entra directamente en el [Operational Model](../17-operational-model/).**

Todo cambio debe estar respaldado por un [Validation Report](./05-validation-reports/README.md).

---

## Flujo obligatorio (FASE 5)

```text
VS → VR → MC propuesto (aparcado)
        ↓
[tras VS-001…006] Análisis conjunto de brechas
        ↓
Operational Dynamics v0.2 (marco único)
        ↓
Tren MC → edición 17-operational-model ✅
```

> **Principio 16:** no aplicar cambios al Operational Model después de cada VS.  
> Acumular evidencia; corregir causas estructurales, no síntomas.

---

## Plantilla · MC-xxx

```markdown
# MC-xxx — [Título]

**Validation Report:** VR-xxx  
**Fecha:** YYYY-MM-DD  
**Capa afectada:** UL · Core Object · Dependency · Lifecycle · Invariant · Mapping

## Problema demostrado

[Qué falló en validación — citar VR]

## Cambio propuesto

[Texto o diff conceptual — qué archivo(s) en 17]

## Impacto en jerarquía

- ¿Toca Invariants? INV-…  
- ¿Nuevos Checks en transición?  
- ¿Capabilities afectadas en 06?

## Aprobación

- [ ] Revisado contra Constitución  
- [ ] Sin violar jerarquía Invariant → Lifecycle → Check → Capability  
- [ ] Aplicado en 17-operational-model

## Estado

⏳ propuesto · ✅ aplicado · ❌ rechazado
```

---

## Índice

| ID | Título | VR | Estado |
|----|--------|-----|--------|
| [MC-001](./MC-001-amend-and-revise-transitions.md) | Amend Order + Revise Plan/Route | VR-001 | ✅ aplicado |
| [MC-002](./MC-002-pause-batch-replan-execution.md) | Pause Batch + Replan In execution + Kitchen | VR-002 | ✅ aplicado |
| [MC-003](./MC-003-lot-traceability-recall.md) | Lot · traza inversa · INV-031 | VR-003 | ✅ aplicado |
| [MC-004](./MC-004-packaging-hold-relabel.md) | Packaging Hold · Label Void/reapply | VR-004 | ✅ aplicado |
| [MC-005](./MC-005-cardinality-parallelism-docs.md) | Cardinalidad Kitchen/Vehicle · paralelismo | VR-005 | ✅ aplicado |
| [MC-006](./MC-006-location-supporting-expedite.md) | Location Supporting · Plan expedito | VR-006 | ✅ aplicado |

**Marco:** [Operational Dynamics v0.2](../../17-operational-model/07-operational-dynamics/README.md) · [09 joint gap analysis](../09-joint-gap-analysis.md)

**Aplicación en `17`:** `spine-transitions` · `support-transitions` · `checks-on-transitions` · `state-index` · `level-2-supporting` · `spine-flow` · INV-031 · taxonomy.

---

## Qué no va aquí

- Cambios de código Foundation o Domain por «comodidad».  
- Nuevos Core Objects sin pasar filtro 02 **y** VR que demuestre insuficiencia.  
- Ajustes de UI o Blueprint sin certificación.

---

## Relacionado

- [05 validation-reports](./05-validation-reports/README.md)  
- [07 certification](./07-certification.md)
