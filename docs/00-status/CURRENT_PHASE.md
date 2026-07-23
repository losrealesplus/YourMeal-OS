# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Documentary / SaaS identity: Closed (pending #25 → main)
Engineering Phase: Complete (pending operational authorization)
Experience base (EatClean): **Frozen** — [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) (#24→#30)
Current Phase:     Evidence Gate  (pre-ORR)  +  Milestone EatClean Pilot Ready 🟡
Next Gate:         ORR  (PASSED | BLOCKED)
Next Discipline:   Operational Engineering
Primary Artifact:  Field Evidence + ciclo E2E (EP-001…EP-005)
Focus operativo:   ¿Está listo para evidencia? · Smoke HP-001 · ORR
Focus piloto:      ¿Cliente pide y el equipo produce/entrega — con evidencia FOPEBA?
Last Baseline:     v0.2.0-engineering-baseline (IR-001)

══════════════════════════════════════════════════
```

Cierre formal ingeniería: [ENGINEERING_PHASE](./ENGINEERING_PHASE.md).  
Experiencia base: [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅ Frozen.  
Milestone abierto: [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md).  
Documentación evolutiva: [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md).

```text
Foundation ✅ → Governance ✅ → OM ✅ → Implementation ✅
→ Engineering Baseline ✅ → Dictionary + ADR-0014 ✅ (#25)
→ Experience base EatClean ✅ Frozen (ACT-001 · #24→#30)
───────────────
Piloto: EP-001 → EP-005  ·  Operational Engineering tras ORR PASSED
```

> ❌ No polish estético por preferencia (ACT-001).  
> Dos líneas: **evidencia operativa** (FOPEBA) y **piloto E2E** (CJ → OJ → Outcome → Evidence).  
> Motores de cambio: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

---

## Dos líneas de trabajo (independientes)

### Línea operativa (no se mueve)

```text
Migration → Smoke HP-001 → ORR → FOV
```

Pregunta: ¿Hay evidencia para ORR? Congelación funcional hasta ORR.

### Línea de piloto — EatClean Pilot Ready 🟡

```text
EP-001 Weekly Experience
        ↓
EP-002 Kitchen Operations
        ↓
EP-003 Delivery Operations
        ↓
EP-004 Operational Close
        ↓
EP-005 Evidence Collection
```

Pregunta: **¿Una persona nueva completa el pedido mientras el equipo lo produce y entrega — y FOPEBA recoge evidencia?**

Acta experiencia: [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md).  
Acta piloto: [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md).

---

## Dominios oficiales

Mapa: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

| Dominio | Entregable | Estado |
|---------|------------|--------|
| **Knowledge** | Operational Model | ✅ Frozen / Closed |
| **Engineering** | Código | ✅ Implementado · ✅ #23 en main |
| **Experience** | CJ + OJ + identidad Tenant | ✅ **ACT-001 Frozen** · 🟡 Pilot Ready (EP-001…005) |
| **Operations** | Evidencia | ⏳ Smoke → ORR → FOV · EP-005 |

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
#25 → main → Apply migration → Smoke HP-001 → ORR → PASSED → Ready for FOV → FOV-001
```

| Evento | Estado |
|--------|:------:|
| PR #23 merge (hardening) | ✅ |
| PR #25 merge (Dictionary · ADR-0014 · Experience Spec) | ⏳ |
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
