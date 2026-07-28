# P13 · Certification Completeness

**FOPEBA · Evidence Framework**  
**Estado:** Accepted · 2026-07-28  
**Complementa:** P11 Evidence before Versioning · [P12 Evidence Freshness](./10-evidence-freshness-p12.md)  
**Aplicación:** [RI-001 Operational Readiness Backlog](../00-status/RI001_OPERATIONAL_READINESS_BACKLOG.md)

---

## Regla

> **Un bloque no podrá marcarse como CERTIFIED mientras exista cualquier evidencia obligatoria pendiente para ese bloque.**  
> **El porcentaje de implementación no sustituye al porcentaje de certificación.**

```text
90% implementado  ≠  90% certificado
```

Un único flujo crítico sin validar puede impedir la certificación completa.

---

## Por qué existe

FOPEBA ya exige que la evidencia **exista** (P11) y esté **vigente** (P12).  
P13 exige que la evidencia del **alcance del bloque** esté **completa** antes de avanzar.

Sin P13, un equipo puede declarar “casi listo” por features entregadas mientras el gate de certificación (CG-RI-001) sigue vacío.

---

## Evidence Gate (por bloque)

Cada bloque del backlog de certificación termina con un **Evidence Gate**:

```text
STATUS · Evidence checklist · Gate PASS|FAIL
        ↓
PASS → puede comenzar el siguiente bloque
FAIL → completar evidencias obligatorias (no saltar)
```

No se inicia el bloque N+1 con el gate N en FAIL (salvo waiver explícito documentado).

---

## Qué cuenta como certificado

| Cuenta | No cuenta |
|--------|-----------|
| Evidencia obligatoria del bloque ejecutada y registrada | Código mergeado sin recorrido |
| Hallazgos clasificados | “Lo probé un momento” sin Session Log |
| Gate PASS explícito | % de tareas de implementación |

---

## Relación

- [P12](./10-evidence-freshness-p12.md) — vigencia  
- [ORC](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) — Surface / Flow  
- [DICT-077](../99-reference/PROJECT_DICTIONARY.md) — Certification Completeness  
- [RI-001 Ops Readiness Backlog](../00-status/RI001_OPERATIONAL_READINESS_BACKLOG.md) — Evidence Gates A–I · DONE  

---

## Futuro (no ahora) · P14 Certification Traceability

Para un segundo producto FOPEBA: Requirement → Evidence → Gate → Decision.  
No abrir P14 en RI-001.
