# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Foundation of Materialization: **Frozen v1** — [ACT-002](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) (#24→#31)
Experience base (EatClean): **Frozen** — [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) (#24→#30)
Engineering Phase: Complete (pending operational authorization)
Current Phase:     Pilot Ready  ·  Evidence Gate  +  ORR Party/B2B/B2C
Next Gate:         ORR  (PASSED | BLOCKED)  ·  [ORR_B2B_B2C_PARTY](./ORR_B2B_B2C_PARTY.md)  +  ciclo EP-001…EP-005
Next Discipline:   Demostrar (no diseñar) · Operational Readiness (no new modules until ORR)
Primary Artifact:  [ORR Party](./ORR_B2B_B2C_PARTY.md) · [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md)
Focus operativo:   ¿Tres recorridos (Particular · Empresa staff · Empleado) E2E?
Focus experiencia: ¿Mi madre podría pedir sin que nadie le explique la app?
Focus piloto:      ¿EatClean opera una semana solo con YourMeal OS + evidencia FOPEBA?
Completitud UI:    [Functional Completeness](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md) · cero humo (Inventario/Clientes ops aún 🟡)
Last Baseline:     v0.2.0-engineering-baseline (IR-001)

══════════════════════════════════════════════════
```

Materialization: [ACT-002](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) ✅ Frozen v1.  
Experiencia base: [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅ Frozen.  
Guía de validación: [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md).  
Milestone abierto: [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md).  
Mapa del sistema: [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md).

```text
Foundation ✅ → Methodology ✅ → Tenant Branding ✅ → Experience Baseline ✅
→ Materialization ✅ Frozen (ACT-002 · #24→#31)
───────────────
Piloto: demostrar  ·  EP-001 → EP-005  ·  FOPEBA observa
```

> ❌ No diseñar / no polish estético (ACT-001 · ACT-002).  
> ✅ Demostrar el ciclo: Cliente → Sistema → Cocina → Reparto → Cliente → Evidencia.  
> Motores de cambio: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

---

## Pregunta de éxito (Fase 2)

> **¿Puede un negocio real operar durante una semana completa utilizando exclusivamente YourMeal OS y generar evidencia suficiente para que FOPEBA confirme, corrija o amplíe el conocimiento obtenido?**

---

## Frozen v1 (no reabrir por preferencia)

| Bloque | Acta / ancla |
|--------|----------------|
| Foundation | Foundation Lock |
| Methodology | Acta metodología · FOPEBA · Dictionary · Knowledge Lifetime |
| Tenant Branding | ADR-0014 · Brand Contract · PR #31 |
| Experience Baseline | [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) |
| Materialization | [ACT-002](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) · [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md) |

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

Ejecución: [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md).

FOPEBA en piloto:

```text
Construcción → Validación → Observación → Aprendizaje → Knowledge Update
```

---

## Dominios oficiales

Mapa: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md). Capas: [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md).

| Dominio | Entregable | Estado |
|---------|------------|--------|
| **Knowledge** | Operational Model · FOPEBA | ✅ Frozen / Closed · observa en piloto |
| **Engineering** | Código · Platform Layer | ✅ Implementado · Materialization Frozen |
| **Experience** | CJ + OJ + identidad Tenant | ✅ ACT-001 · ✅ ACT-002 |
| **Operations** | Evidencia · semana piloto | ⏳ Smoke → ORR → FOV · EP-001…005 |

---

## Regla de congelación funcional

> **Hasta que ORR emita un resultado, ningún commit puede modificar el comportamiento funcional del producto.**

Admitido únicamente:

* bloqueo descubierto en Smoke o en el piloto;  
* corrección imprescindible para completar HP-001 / EP;  
* documentación de evidencia.

Cualquier “pequeña mejora” en el merge **espera** al siguiente ciclo.

---

## Cadena (sin pasos intermedios)

```text
#31 / ACT-002 → main → Apply migration → Smoke HP-001 → ORR → PASSED → Ready for FOV → FOV-001
                └── paralelo: semana piloto (PILOT_EXECUTION_GUIDE · EP-001…005)
```

| Evento | Estado |
|--------|:------:|
| PR #23 merge (hardening) | ✅ |
| PR #24→#30 Experience + ACT-001 | ✅ / en curso según merge |
| PR #31 Tenant-Managed + ACT-002 | ⏳ |
| Migración `program_draft_order` | ⏳ |
| Smoke HP-001 | ⏳ |
| ORR | ⏳ |
| Ready for FOV | ⏳ |
| Semana piloto EatClean | ⏳ |

### Recorrido a observar (Smoke / FOV / piloto)

```text
Login → Customer App → Weekly Menu → Seleccionar platos
→ Programar pedido → Resumen → Confirmar
→ Centro de Operaciones → Cocina → Reparto → Cierre
→ Evidencia FOPEBA
```

Ese flujo ya no valida la arquitectura de materialización: **la da por congelada** y valida la **operación**.

---

## Operational Confidence

| Dimensión | Estado |
|-----------|:------:|
| Knowledge Confidence | 🟢 |
| Engineering Confidence | 🟢 |
| Materialization Confidence | 🟢 |
| Operational Confidence | ⚪ |

---

## Regla permanente (post-ORR / durante piloto)

> **La FOV produce evidencia. El Gate decide cambios.**  
> FOPEBA observa; no inventa metodología en caliente.

## Lenguaje oficial

[PROJECT_DICTIONARY](../99-reference/PROJECT_DICTIONARY.md) — autoridad semántica (`DICT-xxx` · Status · Madurez). Concepto Accepted → Dictionary **antes** de uso oficial.

Ver [ENGINEERING_PHASE](./ENGINEERING_PHASE.md) · [FOV-001](../30-field-validation/FOV-001_HP-001.md).

---

Checklists: [SMOKE_HP-001](./SMOKE_HP-001.md) · [ORR](../22-implementation/ORR.md) · [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md) · [FOV-001](../30-field-validation/FOV-001_HP-001.md) (solo tras ORR PASSED).
