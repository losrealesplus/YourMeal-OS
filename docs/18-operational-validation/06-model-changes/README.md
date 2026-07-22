# 06 · Model Changes

**Regla innegociable:**

> **Ningún cambio entra directamente en el [Operational Model](../17-operational-model/).**

Todo cambio debe estar respaldado por un [Validation Report](./05-validation-reports/README.md).

---

## Flujo obligatorio

```text
VR-xxx (dictamen ⚠ 🔁 🚨)
        ↓
MC-xxx (propuesta de cambio documentada)
        ↓
Revisión (Constitución / Lifecycles / UL según capa)
        ↓
Edición en docs/17-operational-model/
        ↓
Referencia MC en CHANGELOG + diario
```

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
| [MC-001](./MC-001-amend-and-revise-transitions.md) | Amend Order + Revise Plan/Route (Ready) | VR-001 | ⏳ propuesto |
| [MC-002](./MC-002-pause-batch-replan-execution.md) | Pause Batch + Replan In execution + Kitchen | VR-002 | ⏳ propuesto |

---

## Qué no va aquí

- Cambios de código Foundation o Domain por «comodidad».  
- Nuevos Core Objects sin pasar filtro 02 **y** VR que demuestre insuficiencia.  
- Ajustes de UI o Blueprint sin certificación.

---

## Relacionado

- [05 validation-reports](./05-validation-reports/README.md)  
- [07 certification](./07-certification.md)
