# RI-001 Operational Readiness Backlog

**Nombre oficial:** RI-001 Operational Readiness Backlog  
**Alcance del programa:** **[FROZEN](./RI001_PROGRAM_FROZEN.md)** · 2026-07-28  
*(no “Stabilization Backlog” — el cuello de botella es evidencia operacional)*  

**Epic marco:** EP-OPS-001 · RI-001 Operational Certification  
**Gate final:** [CG-RI-001](../10-validation/reports/RI001_CERTIFICATION_REPORT.md)  
**Principios:** P11 Evidence before Versioning · [P12](../20-evidence-framework/10-evidence-freshness-p12.md) · **[P13 Certification Completeness](../20-evidence-framework/12-certification-completeness-p13.md)**

> **Frozen:** no nuevas tareas de alcance. Solo ejecutar A–I, corregir hallazgos de certificación, o reabrir un gate con aprobación explícita. Todo lo demás → otra épica.

```text
P11  evidencia antes de versionar
P12  evidencia vigente
P13  evidencia completa del bloque  →  CERTIFIED
```

**Pregunta maestra (cada tarea):**

> **¿Qué evidencia falta para poder certificar que YourMeal OS opera una empresa real?**

```text
Features → Evidencia
Bugs → Brechas operacionales
Implementación → Certificación
"Done" → "Certified"
```

**Método:** [ORC](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) · [FCR_SESSION_LOG](../10-validation/FCR_SESSION_LOG.md) · [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md)

---

## RI-001 DONE (definición de salida del programa)

RI-001 **no** se cierra porque “ya no quedan tareas”.  
Se cierra solo cuando:

```text
RI-001 DONE cuando:

✓ Todos los bloques A–I = PASS (Evidence Gate).
✓ Todos los Evidence Gates = PASS.
✓ RI-001 Progress = 100% (certificación, no implementación).
✓ No existen observaciones críticas (P0/P1) abiertas.
✓ Certification Report emitido.
✓ Decisión CG-RI-001 = READY o READY WITH OBSERVATIONS.
✓ Existe evidencia reproducible para cada decisión de certificación.
```

Cualquier ítem en FAIL o evidencia obligatoria pendiente → **RI-001 no DONE** (P13).

---

## Evolución futura (no ahora) · P14 Certification Traceability

Cuando FOPEBA se aplique a un **segundo producto**, cada evidencia debería rastrear:

```text
Requirement → Evidence → Certification Gate → Decision
```

Ejemplo: `OPS-001` → Kitchen Workspace Validation → Gate C PASS → Progress → Report.

**No implementar en RI-001.** Anotar solo. Ver [P13](../20-evidence-framework/12-certification-completeness-p13.md) § Futuro.

---

## RI-001 Progress (vivo)

*Actualizar al cerrar cada Evidence Gate. Implementación ≠ certificación (P13).*

```text
RI-001 Progress

Foundation            ░░░░░░░░░░   0%   Gate —
Surfaces              ██████████ 100%   CERTIFIED · PASS (EP-OPS-002 #88)
Workspaces            ██████████ 100%   4/4 CERTIFIED · EP-OPS-003 Complete · G NOT STARTED
Language              ░░░░░░░░░░   0%   Gate —
RBAC Access           ░░░░░░░░░░   0%   Gate —
Observability         ░░░░░░░░░░   0%   Gate —
Flows                 ░░░░░░░░░░   0%   Gate — · elegible · NOT STARTED
Auth Transition       ░░░░░░░░░░   0%   Gate —
Certification Report  ░░░░░░░░░░   0%   Gate —

Overall (certificación)          ~28%   (B+C DONE · Bloque G NOT STARTED)
```

| Bloque | Nombre | Gate | % cert. |
|--------|--------|:----:|--------:|
| A | Foundation | — | 0 |
| B | Surfaces | **PASS / CERTIFIED** (EP-OPS-002) | 100 |
| C | Workspaces | **PASS** · 4/4 Journeys CERTIFIED · EP-OPS-003 Complete | 100 |
| D | Language | — | 0 |
| E | RBAC Access | — | 0 |
| F | Observability | — | 0 |
| G | Flows | — · elegible · **NOT STARTED** | 0 |
| H | Auth Transition | — | 0 |
| I | Certification Report | — | 0 |

\* Entry CERTIFIED; Kitchen+Delivery+Support+Accounting CERTIFIED (Support+Accounting vía FAIL→Correction→Re-Cert).

---

## Organización

```text
A Foundation → B Surfaces → C Workspaces → D Language
→ E RBAC → F Observability → G Flow → H Auth → I Report
```

Cada bloque termina en un **Evidence Gate**.  
**PASS** → puede comenzar el siguiente. **FAIL** → no saltar (P13).

---

## Evidence Gate (plantilla)

Al cerrar **cada** bloque:

```text
STATUS
  NOT STARTED | IN REVIEW | CERTIFIED

Evidence (obligatoria del bloque)
  ☑ … checklist del bloque …

Gate
  PASS | FAIL

↓
PASS → puede comenzar el siguiente bloque
FAIL → completar evidencia obligatoria
```

Más:

### REVALIDATION CHECK · superficies

```text
¿Este bloque modificó otra superficie?
NO → Continuar
SÍ → Revalidar únicamente la(s) afectada(s)
```

### REVALIDATION CHECK · flujos

```text
¿Este bloque modificó un flujo certificado?
NO → Continuar
SÍ → Recertificar únicamente ese flujo
```

### Disciplina

- No corregir mientras se inspecciona.
- No abrir metodología nueva a mitad de bloque.
- Toda observación → evidencia + clasificación.

---

## Bloque A · Foundation Validation

**Objetivo:** confirmar que la base de certificación no ha cambiado.

| Ítem | Evidencia / artefacto | Estado |
|------|------------------------|--------|
| Identity Frozen v1 | [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) | □ |
| Infrastructure Stable | DV-001 · [DEPLOYMENT_VERIFICATION](../10-validation/DEPLOYMENT_VERIFICATION.md) | □ |
| PRE-CHECK (P12) | [P12](../20-evidence-framework/10-evidence-freshness-p12.md) | □ |
| Bloqueadores abiertos | Lista + severidad | □ |

### Evidence Gate · A

```text
STATUS: NOT STARTED / IN REVIEW / CERTIFIED

Evidence
  □ Identity Frozen vigente
  □ Infra / DV estable
  □ P12 PRE-CHECK aplicado a hallazgos abiertos
  □ Bloqueadores listados

Gate: — (PASS solo con ☑ completos)
```

**Salida:** Foundation Certified → puede comenzar **B**.

---

## Bloque B · Surface Certification

| Superficie | Surface Status |
|------------|:--------------:|
| Tenant Surface `/admin` | **CERTIFIED** (EP-OPS-002) |
| Platform Surface `/saas` | **CERTIFIED** (EP-OPS-002) |
| Customer Surface `/app` | Landing documentado · jornada Customer fuera de este epic |

> **EP-OPS-002:** ciclo Discovery → Evaluation → Correction → Re-Certification → **CERTIFIED**.  
> Evidencia: [EP_OPS_002](../10-validation/EP_OPS_002_PRECHECK.md) · [Surface Matrix](../10-validation/SURFACE_MATRIX.md) · WEP · LP · RBAC Surface.

### Evidence Gate · B

```text
B · Surface Certification · Tenant + Platform

STATUS: CERTIFIED

Evidence
  ☑ Navegación / landings — SURFACE_NAVIGATION_REPORT
  ☑ Separación de superficies — RBAC_SURFACE_CERTIFICATION
  ☑ Matrix — SURFACE_MATRIX
  ☑ Casos negativos cross-surface PASS
  ☑ RBAC-001 · WEP-001 · LP-001 = CERTIFIED (P13)

Gate: PASS
```

**Salida:** superficies Tenant + Platform CERTIFIED → foco en **C · Operational Journeys**.

---

## Bloque C · Department Workspace Certification

**Vehículo activo:** [EP-OPS-003 · Workspace Operational Journey](./EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md)  
**Metodología:** ✅ **FROZEN** — [EP_OPS_003_METHODOLOGY_FROZEN](./EP_OPS_003_METHODOLOGY_FROZEN.md)  
**1ª validación:** ✅ **CLOSED** — [EP_OPS_003_FIRST_VALIDATION_CLOSED](./EP_OPS_003_FIRST_VALIDATION_CLOSED.md)  
**Evidencia:** [docs/10-validation/ep-ops-003/](../10-validation/ep-ops-003/README.md)  
**Prerrequisito:** Entry CERTIFIED (EP-OPS-002 · RBAC-001 · WEP-001 · LP-001)

> **EP-OPS-003 (Journeys) COMPLETE** — [acta](./EP_OPS_003_JOURNEYS_COMPLETE.md).  
> **Capa Entry+Journey CLOSED** — [OPERATIONAL_CERTIFICATION_LAYER_CLOSED](./OPERATIONAL_CERTIFICATION_LAYER_CLOSED.md).  
> Framework Frozen · Bloque G elegible · **NOT STARTED** (objeto = handoffs).

Pregunta Entry (cerrada): *¿Dónde entra el usuario?*  
Pregunta Journey (cerrada): *¿Puede cada departamento completar su trabajo?*  
Pregunta Flow (Bloque G · no iniciada): *¿Puede la empresa operar end-to-end?*

| Workspace | Entry | Outcome | Journey Gate | Estado |
|-----------|:-----:|---------|:------------:|--------|
| Kitchen | CERTIFIED* | Production Ready | **OBSERVATIONS** | **CERTIFIED** · [pack](../10-validation/ep-ops-003/kitchen/) |
| Delivery | CERTIFIED* | Orders Delivered | **OBSERVATIONS** | **CERTIFIED** · [pack](../10-validation/ep-ops-003/delivery/) |
| Support | CERTIFIED* | Issues Resolved | **OBSERVATIONS** | **CERTIFIED** · [pack](../10-validation/ep-ops-003/support/) |
| Accounting | CERTIFIED* | Financial Records Complete | **OBSERVATIONS** | **CERTIFIED** · [pack](../10-validation/ep-ops-003/accounting/) |
| Operations | hub `/admin` | — | — | Fuera del núcleo EP-OPS-003 |

**4/4 CERTIFIED.** Accounting: FAIL → Correction P0 (Pending→Review→Processed→Closed) → Re-Cert.  
\* Entry vía EP-OPS-002.

### Evidence Gate · C

```text
Evidence
  ☑ Landing / Entry Policy (EP-OPS-002)
  ☑ Jornada Kitchen — CERTIFIED
  ☑ Jornada Delivery — CERTIFIED
  ☑ Jornada Support — CERTIFIED (tras Correction)
  ☑ Jornada Accounting — CERTIFIED (tras Correction P0)
  ☑ Ciclo P13 FAIL→Correction→Re-Cert (Support · Accounting)
  ☑ Estabilidad upstream preservada
  ☑ Bloque G NOT STARTED (elegible)

Gate: PASS · Bloque C Journeys COMPLETE · Bloque G no abierto automáticamente
```

**Salida:** jornadas CERTIFIED → Language D / preparar Flow G.  
**No** marcar C completo solo porque Entry esté certificado.

---

## Bloque D · Operational Language Review

Alinear: Workspace · Intake · Order · Production · Dispatch · Route · Batch · Delivery · Customer · Order Source · Demand Channel.

### Evidence Gate · D

```text
Evidence
  □ Divergencias DICT / OM / UI listadas
  □ Divergencias cerradas o waiver
  □ Glosario piloto coherente

Gate: — → PASS → puede comenzar E
```

---

## Bloque E · RBAC & Operational Access

Separado de Auth (no reabre Identity Freeze).

### Evidence Gate · E

```text
Evidence
  □ Matriz rol × superficie verificada
  □ Sin accesos cruzados indebidos
  □ FCR-001 / hallazgos access clasificados

Gate: — → PASS → puede comenzar F
```

---

## Bloque F · Observability Readiness

Sin añadir observabilidad nueva: validar evidencia existente.

| Campo | □ |
|-------|---|
| Actor | |
| Timestamp | |
| Tenant | |
| Superficie | |
| Canal (Order Source) | |
| Operación | |

### Evidence Gate · F

```text
Evidence
  □ Campos críticos presentes en ops clave
  □ Gaps listados (sin features nuevas)

Gate: — → PASS → puede comenzar G
```

---

## Bloque G · Flow Certification

**Estado:** ⏳ **NOT STARTED** · elegible tras [EP-OPS-003 Journeys COMPLETE](./EP_OPS_003_JOURNEYS_COMPLETE.md)  
**Framing (sin ejecución):** [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md)  
**Plantilla:** [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md)

> Pregunta de nivel: *¿Puede la empresa operar de extremo a extremo?*  
> Certifica **handoffs** (Outcome → Next Outcome), no departamentos ya CERTIFIED.

Handoffs a certificar:

| From | To | Artefacto |
|------|----|-----------|
| Kitchen | Delivery | Production Ready |
| Delivery | Support | Orders Delivered |
| Support | Accounting | Issues Resolved / eventos financieros |
| Accounting | Cierre operativo | Financial Records Complete |

### Evidence Gate · G

```text
Evidence
  □ Flujo A Pedido normal
  □ Flujo B Personalizado
  □ Flujo C Incidencia
  □ Handovers críticos sin Flow Gap P0/P1
  □ Framing handoffs aplicado (no pantallas-first)

Gate: — → PASS → puede comenzar H
Status: NOT STARTED (apertura explícita requerida)
```

---

## Bloque H · Authentication Transition

| Sub | Objetivo | Cuándo |
|-----|----------|--------|
| AUTH-A | Flujo Auth real | Escenarios finales |
| AUTH-B | Quitar bootstrap temporal | **Solo** tras flujos certificados |

### Evidence Gate · H

```text
Evidence
  □ AUTH-A: login real operable en entorno de cert
  □ AUTH-B: Bootstrap / smoke OFF en cert final
  □ Identity Freeze respetado

Gate: — → PASS → puede comenzar I
```

---

## Bloque I · RI-001 Certification Report

No se desarrolla. Solo decisión con evidencia.

| Veredicto | |
|-----------|--|
| **READY** | |
| **READY WITH OBSERVATIONS** | |
| **NOT READY** | |

### Evidence Gate · I

```text
Evidence
  □ Gates A–H PASS (o waivers)
  □ Session Log + Flow evidence adjuntos
  □ Decisión CG-RI-001 emitida

Gate: PASS = informe firmado
```

---

## Relación con artefactos

| Artefacto | Bloques |
|-----------|---------|
| FCR Session Log · Pasada 2 | B · C · E |
| FLOW_CERTIFICATION | G |
| Order Intake ADR 0017 | D · F · G |
| P13 Certification Completeness | todos los Evidence Gates |
| ORR / CG-RI-001 | tras I |
