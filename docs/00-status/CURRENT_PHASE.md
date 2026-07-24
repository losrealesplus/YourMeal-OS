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
Fase:                **CERTIFICACIÓN OPERACIONAL** (no “SaaS en desarrollo”)
Naturaleza:          Demostrar operación real sin ingeniería
Pregunta del Gate:   **¿Qué evidencia falta para una decisión objetiva sobre RI-001?**
Gate:                [CG-RI-001](./RI001_CERTIFICATION_GATE.md) · salidas: READY | RWO | NOT READY
Informe:             [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md) ← **artefacto de decisión** (no cronología)
Congelación:         Capas FON/FOPEBA/Knowledge congeladas · YourMeal OS = defectos+evidencia · CG activo
Alcance certificación: valida **capacidad operacional** (no “calidad del software” aislada)
Cierre RI-001:       Report emitido + decisión firmada con evidencia + cosecha FOPEBA
                     → YourMeal OS = primer caso de referencia **certificado** de FOPEBA
Capas:               FON AI → FOPEBA → Knowledge → YourMeal OS → CG-RI-001 → EatClean
Artefacto primario:  [RI001_CERTIFICATION_REPORT](./RI001_CERTIFICATION_REPORT.md) (tras Gate)
Gate / Board:        [CG-RI-001](./RI001_CERTIFICATION_GATE.md) · [Release Board](./EP_OPS_001_RELEASE_BOARD.md)

Pilot Readiness (lectura)
  Arquitectura        ██████████  100%
  Gobernanza          ██████████  100%
  Modelo operacional  ██████████  100%  ← OCM-001
  Implementación      █████████░
  Certificación       ███░░░░░░░  ← Gate + Report (no nuevos principios)
  Operaciones (hub)   ██████░░░░  ← EP-OPS-001 entrada al Gate

Mapa EP:
  FASE 0 · FOUNDATION              ██████████
  EP-001…EP-002B.2                 ██████████
  —— EP-OPS-001 (entrada Gate) ——  □□□□□□□□□□  ← HOY
  —— Architecture Freeze ——        □□□□□□□□□□
  —— RI-001 CERTIFICATION GATE ——  □□□□□□□□□□
  —— RI-001 Certification Report —— □□□□□□□□□□  ← decisión + cosecha FOPEBA
  EP-002B.3–B.4 (cola)             □□□□□□□□□□

Hoy: Capas estabilizadas · Report = decisión justificada por evidencia · cierre RI-001 = Report + firma + FOPEBA.
Ciclo: principios → conocimiento → implementación → certificación → conocimiento validado → siguiente producto.

Riesgo principal: abrir FCR/E2E sin EP-OPS-001 PASS → evidencia contaminada

Incertidumbres de diseño grandes: **ninguna**.
Congelación metodológica: **activa** hasta Certification Report + cosecha FOPEBA.

G-02 = Pilot Authorization  ≠  Release / v1.0
Pregunta del Report: ¿Por qué esta decisión está justificada por la evidencia disponible?

Primary Artifact:  [Report](./RI001_CERTIFICATION_REPORT.md) · [Gate](./RI001_CERTIFICATION_GATE.md) · [Board](./EP_OPS_001_RELEASE_BOARD.md) · [OCM](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [ORS](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md)
Evidence:          [DICT-006](../99-reference/PROJECT_DICTIONARY.md#evidence) — escenario ejecutado y documentado
Visibilidad:       [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)
Ops pattern:       [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md)
Tenant autonomy:   [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)
OCM / Gate / ORS:  DICT-074 · DICT-075 · DICT-076
Hoy (Certificación): [Report](./RI001_CERTIFICATION_REPORT.md) · [Gate](./RI001_CERTIFICATION_GATE.md) · [Board](./EP_OPS_001_RELEASE_BOARD.md) · [OCM](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [ORS](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)
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
> ✅ Tenant Operational Autonomy (DICT-073): el tenant se autogestiona sin el proveedor SaaS.  
> ✅ OCM-001 (DICT-074) · Certification Gate (DICT-075) · ORS-001 (DICT-076).  
> ✅ Evidence (DICT-006): escenario ejecutado y documentado — no opinión ni diff aislado.  
> 🔒 Congelación metodológica hasta RI-001 Certification Report.  
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
