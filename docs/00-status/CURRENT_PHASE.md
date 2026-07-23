# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Documentary / SaaS identity: Closed (pending #25 → main)
Engineering Phase: Complete (pending operational authorization)
Experience base (EatClean): Closed (#24→#29) — identidad · CJ/OJ · Operaciones
Current Phase:     Evidence Gate  (pre-ORR)  +  Milestone EatClean Pilot Ready 🟡
Next Gate:         ORR  (PASSED | BLOCKED)
Next Discipline:   Operational Engineering
Primary Artifact:  Field Evidence + ciclo E2E (EP-01…EP-04)
Focus operativo:   ¿Está listo para evidencia? · Smoke HP-001 · ORR
Focus piloto:      ¿Cliente pide y el equipo produce/entrega en la misma plataforma?
Last Baseline:     v0.2.0-engineering-baseline (IR-001)

══════════════════════════════════════════════════
```

Cierre formal ingeniería: [ENGINEERING_PHASE](./ENGINEERING_PHASE.md).  
Milestone abierto: [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md).  
Documentación evolutiva: [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md).

```text
Foundation ✅ → Governance ✅ → OM ✅ → Implementation ✅
→ Engineering Baseline ✅ → Dictionary + ADR-0014 ✅ (#25)
→ Experience base EatClean ✅ (#24→#29)
───────────────
Comienza Operational Engineering  (tras ORR PASSED)
Piloto: EP-01 Weekly Experience → EP-04 Operational Close
```

> Dos líneas en paralelo: **evidencia operativa** (FOPEBA) y **piloto E2E** (Customer Journey → Operational Journey → Outcome). No compiten.  
> Estabilidad conceptual: el valor siguiente es **demostrar el ciclo completo con datos reales**, no reabrir PRs de identidad.  
> Motores de cambio por dominio: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

---

## Dos líneas de trabajo (independientes)

### Línea operativa (no se mueve)

```text
Migration → Smoke HP-001 → ORR → FOV
```

Pregunta: ¿Hay evidencia para ORR? Congelación funcional hasta ORR.

### Línea de piloto — EatClean Pilot Ready 🟡

```text
EP-01 Weekly Experience
        ↓
EP-02 Kitchen Operations
        ↓
EP-03 Delivery Operations
        ↓
EP-04 Operational Close
```

Pregunta: **¿Una persona nueva completa el pedido mientras el equipo lo produce y entrega en la misma plataforma?**

Acta: [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md).

La **experiencia base** (Login · Home · Menú · Operaciones · docs Contract/Implementation) está **cerrada**. No reabrir como PRs «UI» genéricos.

Observación de uso CJ-001 sigue siendo útil: [CJ001_USAGE_OBSERVATION](../07-experience/CJ001_USAGE_OBSERVATION.md).

Docs: [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md) · [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · [`tenants/eatclean/`](../../tenants/eatclean/README.md).

---

## Dominios oficiales

Mapa: [PROJECT_DOMAINS](./PROJECT_DOMAINS.md).

| Dominio | Entregable | Estado |
|---------|------------|--------|
| **Knowledge** | Operational Model | ✅ Frozen / Closed |
| **Engineering** | Código | ✅ Implementado · ✅ #23 en main |
| **Experience** | CJ + OJ + identidad Tenant | ✅ Base cerrada · 🟡 Pilot Ready (EP-01…04) |
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
