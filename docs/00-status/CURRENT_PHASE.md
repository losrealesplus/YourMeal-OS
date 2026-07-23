# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Documentary stack: Closed (pending #24 → main)
Engineering Phase: Complete (pending operational authorization)
Current Phase:     Evidence Gate  (pre-ORR)
Next Gate:         ORR  (PASSED | BLOCKED)
Next Discipline:   Operational Engineering
Primary Artifact:  Field Evidence
Focus:             Abrir la app · recorrido HP-001
Last Baseline:     v0.2.0-engineering-baseline (IR-001)

══════════════════════════════════════════════════
```

Cierre formal: [ENGINEERING_PHASE](./ENGINEERING_PHASE.md).

```text
Foundation ✅ → Governance ✅ → OM ✅ → Implementation ✅
→ Engineering Baseline ✅ → Project Dictionary ✅ (#24)
───────────────
Comienza Operational Engineering  (tras ORR PASSED)
```

> No más inversión en estructura metodológica. El retorno está en **ejecutar** el recorrido y generar evidencia.

---

## Dominios oficiales

| Dominio | Estado |
|---------|--------|
| Knowledge Engineering | ✅ Frozen / Closed |
| Software Engineering | ✅ Implementado · ✅ #23 en main |
| Operational Engineering | ⏳ Pendiente de ORR PASSED |

---

## Regla de congelación funcional

> **Hasta que ORR emita un resultado, ningún commit puede modificar el comportamiento funcional del producto.**

Admitido únicamente:

* bloqueo descubierto en Smoke;  
* corrección imprescindible para completar HP-001;  
* documentación de evidencia.

Cualquier “pequeña mejora” en el merge **espera** al siguiente ciclo.

---

## Cadena (sin pasos intermedios)

```text
#24 → main → Apply migration → Smoke HP-001 → ORR → PASSED → Ready for FOV → FOV-001
```

| Evento | Estado |
|--------|:------:|
| PR #23 merge (hardening) | ✅ |
| PR #24 merge (Dictionary) | ⏳ |
| Migración `program_draft_order` | ⏳ |
| Smoke HP-001 | ⏳ |
| ORR | ⏳ |
| Ready for FOV | ⏳ |

### Recorrido a observar (Smoke / FOV)

```text
Login → Dashboard → Weekly Menu → Seleccionar platos
→ Programar pedido → Resumen → Confirmar → Persistencia → Auditoría
```

Ese flujo ya no valida la arquitectura: valida **experiencia** y genera las primeras observaciones reales (FOV → Knowledge Update → Gate).

---

## Operational Confidence

| Dimensión | Estado |
|-----------|:------:|
| Knowledge Confidence | 🟢 |
| Engineering Confidence | 🟢 |
| Operational Confidence | ⚪ |

---

## Regla permanente (post-ORR)

> **La FOV produce evidencia. El Gate decide cambios.**

## Lenguaje oficial

[PROJECT_DICTIONARY](../99-reference/PROJECT_DICTIONARY.md) — autoridad semántica (`DICT-xxx` · Status · Madurez). Concepto Accepted → Dictionary **antes** de uso oficial.

Ver [ENGINEERING_PHASE](./ENGINEERING_PHASE.md) · [FOV-001](../30-field-validation/FOV-001_HP-001.md).

---

Checklists: [SMOKE_HP-001](./SMOKE_HP-001.md) · [ORR](../22-implementation/ORR.md) · [FOV-001](../30-field-validation/FOV-001_HP-001.md) (solo tras ORR PASSED).
