# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Documentary / SaaS identity: Closed (pending #25 → main)
Engineering Phase: Complete (pending operational authorization)
Current Phase:     Evidence Gate  (pre-ORR)  +  ORR Party/B2B/B2C
Next Gate:         ORR  →  **G-02 · Pilot Readiness**  ·  [PILOT_ACCEPTANCE_CHECKLIST](./PILOT_ACCEPTANCE_CHECKLIST.md)
Next Discipline:   Operational Readiness (no new modules until checklist + ORR)
Primary Artifact:  [PILOT_ACCEPTANCE_CHECKLIST](./PILOT_ACCEPTANCE_CHECKLIST.md) + [ORR Party](./ORR_B2B_B2C_PARTY.md)
Focus operativo:   ¿Operational Journey E2E (pedido → cocina → reparto → entregado)?
Focus experiencia: ¿Mi madre podría pedir sin que nadie le explique la app?
Completitud UI:    Checklist pantalla a pantalla · cero humo · [Functional Completeness](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md)
Last Baseline:     v0.2.0-engineering-baseline (IR-001)

══════════════════════════════════════════════════
```

Cierre formal: [ENGINEERING_PHASE](./ENGINEERING_PHASE.md).

```text
Foundation ✅ → Governance ✅ → OM ✅ → Implementation ✅
→ Engineering Baseline ✅ → Dictionary + ADR-0014 ✅ (#25)
───────────────
Comienza Operational Engineering  (tras ORR PASSED)
Experience: Journey-first (CJ-001) · pantallas MVP ≤ 15
```

> Dos líneas en paralelo: **evidencia operativa** (FOPEBA) y **experiencia Tenant** (Journey → Screen → Capability). No compiten.  
> Estabilidad conceptual: el valor siguiente es **demostrar en campo** (CJ-001 + Smoke/ORR/FOV), no añadir conceptos.  
> Motores de cambio por dominio: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

---

## Dos líneas de trabajo (independientes)

### Línea operativa (no se mueve)

```text
Migration → Smoke HP-001 → ORR → FOV
```

Pregunta: ¿Hay evidencia para ORR? Congelación funcional hasta ORR.

### Línea de experiencia (nuevo frente)

```text
Customer Journeys (CJ-001)
        ↓
Pantallas MVP (≤ 15)
        ↓
Experience Refactor ✅ (UI)
        ↓
Observación de uso  ← AQUÍ
        ↓
EatClean Release UX (solo con evidencia)
```

Pregunta: **¿Mi madre podría hacer un pedido sin que nadie le explique la app?**

**Congelado por intuición.** Siguiente paso: [CJ001_USAGE_OBSERVATION](../07-experience/CJ001_USAGE_OBSERVATION.md) — móvil, cuatro preguntas, sesión sin ayudar.

Sprint UI: [EXPERIENCE_REFACTOR_EATCLEAN_V1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1.md).

Docs: [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · [`tenants/eatclean/`](../../tenants/eatclean/README.md).

---

## Dominios oficiales

Mapa: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

| Dominio | Entregable | Estado |
|---------|------------|--------|
| **Knowledge** | Operational Model | ✅ Frozen / Closed |
| **Engineering** | Código | ✅ Implementado · ✅ #23 en main |
| **Experience** | Customer Journeys + Screens | 🟡 UI CJ-001 lista · **falta observación de uso** |
| **Operations** | Evidencia | ⏳ Smoke → ORR → FOV |

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
