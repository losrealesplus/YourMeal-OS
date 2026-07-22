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
Priorizar MC → edición 17-operational-model
```

> **Principio 16:** no aplicar cambios al Operational Model después de cada VS.  
> Acumular evidencia; corregir causas estructurales, no síntomas.

Durante la batería, los MC viven en esta carpeta como **propuestos / aparcados**.
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
| [MC-001](./MC-001-amend-and-revise-transitions.md) | Amend Order + Revise Plan/Route (Ready) | VR-001 | ⏸ aparcado (batería) |
| [MC-002](./MC-002-pause-batch-replan-execution.md) | Pause Batch + Replan In execution + Kitchen | VR-002 | ⏸ aparcado (batería) |
| [MC-004](./MC-004-packaging-hold-relabel.md) | Packaging Hold · relabel · evidencia | VR-004 | ⏸ aparcado (batería) |

> Ningún MC se aplica a `17` hasta análisis conjunto post VS-006 (principio 16).

**Solapes a resolver en análisis conjunto:** MC-003 Quarantine ↔ MC-004 Hold (Packaging).


---

## Qué no va aquí

- Cambios de código Foundation o Domain por «comodidad».  
- Nuevos Core Objects sin pasar filtro 02 **y** VR que demuestre insuficiencia.  
- Ajustes de UI o Blueprint sin certificación.

---

## Relacionado

- [05 validation-reports](./05-validation-reports/README.md)  
- [07 certification](./07-certification.md)
