# EP-OPS-003 · Methodology Frozen

**Estado:** **METHODOLOGY FROZEN** · 2026-07-28  
**Epic:** [EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY](./EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md)  
**PR:** #89  
**Principios:** P11 Evidence before Versioning · P12 Freshness · [P13 Completeness](../20-evidence-framework/12-certification-completeness-p13.md)

---

## Qué queda congelado

La **metodología** de Journeys (conceptos, gates, continuidad Outcome→Input, orden de pasadas).

La **ejecución** de las pasadas restantes **no** está congelada: Delivery · Support · Accounting siguen abiertas a evidencia de campo.

```text
Metodología EP-OPS-003     FROZEN  ← este acta
Pasadas Journey            OPEN    ← demostrar validez con evidencia
Bloque G Flow              PENDING ← tras las 4 jornadas
```

---

## Niveles consolidados

| Nivel | Estado |
|-------|--------|
| **Entry** | ✅ Certificado (EP-OPS-002) |
| **Journey** | ✅ Metodología fijada (EP-OPS-003) · ejecución en curso |
| **Flow** | ⏳ Pendiente (Bloque G) |

---

## Certification vs Gate (congelado)

| Concepto | Significado |
|----------|-------------|
| **CERTIFIED** | El Outcome operacional se alcanza |
| **Gate = PASS** | Sin observaciones relevantes |
| **Gate = OBSERVATIONS** | Outcome alcanzado con observaciones no bloqueantes |
| **Gate = FAIL** | El Journey no alcanza su Outcome |

Dos preguntas distintas:

1. **¿El departamento puede completar su misión?** → CERTIFIED (sí/no vía Outcome).  
2. **¿Cómo de limpia fue la certificación?** → PASS / OBSERVATIONS / FAIL.

Kitchen (referencia):

| Workspace | Estado | Gate | Outcome |
|-----------|--------|------|---------|
| Kitchen | ✅ CERTIFIED | OBSERVATIONS | Production Ready |

---

## Continuidad Outcome → Input (congelada)

```text
Kitchen     → Production Ready
Delivery    → Orders Delivered          (Input: Production Ready)
Support     → Issues Resolved           (Input: Orders Delivered)
Accounting  → Financial Records Complete (Input: completed ops / incidents / billing)
        ↓
Bloque G · Flow Certification
```

No re-certificar el Journey anterior. Consumir su Outcome como Input.

---

## Permitido / prohibido tras este acta

| Permitido | Prohibido |
|-----------|-----------|
| Ejecutar pasadas Delivery · Support · Accounting | Nuevos conceptos metodológicos sin evidencia que los justifique |
| Recopilar evidencia · cerrar Gates | Redefinir CERTIFIED / Gate / Outcomes |
| Corregir bloqueos hallados **durante** una pasada | Ampliar alcance de EP-OPS-003 (nuevos workspaces / outcomes) |
| Anotar Flow Gaps → Bloque G | Empezar Flow Certification antes de cerrar las 4 jornadas |
| Actualizar Progress / Session Log | Convertir observaciones menores en FAIL automático |

Reabrir metodología solo con **aprobación explícita** + evidencia nueva (P12/P13).

---

## Modo de trabajo a partir de ahora

```text
Metodología deja de evolucionar
        ↓
Demostrar validez mediante evidencia de campo
        ↓
P11 · P12 · P13
```

**Siguiente acción operativa:** pasada **Support** · Outcome **Issues Resolved** · Input **Orders Delivered**.

---

## Referencias

- Epic: [EP_OPS_003](./EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md)  
- Evidence: [ep-ops-003/](../10-validation/ep-ops-003/README.md)  
- Kitchen pack: [kitchen/](../10-validation/ep-ops-003/kitchen/)  
- ORC: [OPERATIONAL_READINESS_CERTIFICATION](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md)  
- RI-001 Program Frozen: [RI001_PROGRAM_FROZEN](./RI001_PROGRAM_FROZEN.md)
