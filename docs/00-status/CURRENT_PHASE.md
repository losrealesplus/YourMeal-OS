# CURRENT_PHASE

**Última actualización:** 2026-07-24  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE · RI-001 · Pilot Readiness
══════════════════════════════════════════════════

FOUNDATION / BLUEPRINT / DISCOVERY / OM / VALIDATION / IOV   ✅
FOV PREPARATION · ORR (marco) · G-02 (Gate formalizado)     ✅
EP-001 Functional Completeness (cero humo Admin/Ops nav)    ✅
────────────────────────────
Modo:                **CERTIFICACIÓN** — Correction de hub OK · **no** Packaging/features nuevas
Siguiente sprint:    **EP-OPS-001 · Operational Center Readiness**
                     (hub `/admin` PASS antes de auditar el resto)
                     · Matriz FCR del resto **en pausa** hasta Ops PASS
                     · Packaging/Delivery **en cola**
Siguiente artefacto: [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)
                     → matriz bloque Ops en verde → reanudar FCR → RI-001

Pilot Readiness (lectura)
  Arquitectura        ██████████
  Gobernanza          ██████████
  Modelo operacional  ██████████
  Administración      ██████████
  Customer App        █████████░  ← certificar tras hub estable
  Operaciones         ███████░░░  ← **EP-OPS-001 hub** (bloqueante)
  Data                ███████░░░

Mapa EP:
  FASE 0 · FOUNDATION              ██████████
  EP-001 · Functional Completeness ██████████
  EP-002A · Customer Experience    ██████████
  EP-002B.1 · Production Report    ██████████
  EP-002B.2 · Kitchen Execution    ██████████
  —— EP-OPS-001 Ops Center ——      □□□□□□□□□□  ← HOY (requisito certificación)
  —— FCR resto / E2E / evidencia —— □□□□□□□□□□  (tras Ops PASS)
  EP-002B.3 · Packaging            □□□□□□□□□□  (cola)
  EP-002B.4 · Delivery             □□□□□□□□□□
  RI-001                           █████████░

Patrón permanente: Operational Representation (DICT-072)
Hoy: ¿Puede cada rol iniciar la jornada en el Centro de Operaciones y completar su trabajo?

Riesgo principal: hub operacional inestable → contaminaría toda la auditoría posterior

Incertidumbres de diseño grandes: **ninguna**.
RI-001 comienza cuando EP-002A y EP-002B estén cerrados.

G-02 = Pilot Authorization  ≠  Release / v1.0
Pregunta principal: ¿Qué nos enseña la operación real sobre nuestro modelo?

Primary Artifact:  [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) · [G-02](../20-evidence-framework/08-gate-g02-pilot-readiness.md)
Visibilidad:       [Operational Visibility · DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)
Ops pattern:       [Operational Representation · DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md)
Hoy (Certificación): [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · [Ops dual surface](./OPS_CENTER_DUAL_SURFACE.md) · [Readiness](./RI001_READINESS_SPRINT.md)
Seguridad pre-piloto: [Pilot Security Checklist](../09-security/PILOT_SECURITY_CHECKLIST.md) (10 corregidos · 1 Accepted documentado)
Antes de firmar G-02 PASSED: ORR firmados · cero humo · No Artificiality
PR taxonomy (post G-02): Evidence · KU · Correction · Pilot Fix · Operational Finding
Completitud UI:    [Matriz RI-001](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) · [EP-001](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) · [EP-002A](./EP002A_CUSTOMER_EXPERIENCE_COMPLETION.md) · [EP-002B](./EP002B_OPERATIONAL_EXECUTION.md)
Hallazgos Lovable: [Decisiones](./LOVABLE_FINDINGS_DECISIONS.md) (contraste ✅ · GSC → [Marketing Readiness](./MILESTONE_MARKETING_READINESS.md) · Semrush draft)
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
Piloto: demostrar  ·  EP-001 ✅ → EP-002A (Weekly Cycle) → EP-002B (Ops) → RI-001 Evidence  ·  FOPEBA observa
```

> ❌ No diseñar / no polish estético (ACT-001 · ACT-002).  
> ✅ EP-002A: ¿Qué necesita **saber** el cliente? (Customer Weekly Cycle)  
> ✅ EP-002B: ¿Qué necesita **hacer** el equipo?  
> ✅ Operational Visibility (DICT-071): lo visible existe; lo inexistente no se promete.  
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
