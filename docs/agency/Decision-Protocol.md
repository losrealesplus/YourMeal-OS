# Protocolo de Decisión y Handoffs Inter-Agencia (Decision Protocol)
## YourMeal Agency Core · Flujo Estructurado de Transición de Requerimientos

---

## 1. Propósito y Principio Central

El **Decision Protocol** define la secuencia formal mediante la cual una necesidad de negocio, hipótesis comercial, refactorización técnica o reporte de error transita a través de la Agency Core desde su recepción inicial hasta su verificación final.

> **REGLA FUNDAMENTAL:**  
> Queda terminantemente prohibido cualquier atajo o salto directo de autoridad (ej. `Growth → Engineering` o `Architecture → Deploy`). Todo cambio debe seguir el flujo secuencial de handoffs estandarizados.

---

## 2. Diagrama de Transición de Requerimientos

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. REQUERIMIENTO / SEÑAL COMERCIAL (Growth / Stakeholder)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 1: Product Feedback Handoff]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REVISIÓN DE GOBERNANZA (Foundation Guardian)             │
│    Dictamen: ALLOW / ALLOW WITH CONDITIONS / ADR REQUIRED   │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 2: Architectural Mandate]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DISEÑO ARQUITECTÓNICO & ADR (Software Architect)         │
│    Especificación técnica, contratos y capabilities         │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 3: Engineering Specification]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONSTRUCCIÓN TÉCNICA (DB / Backend / Frontend Engineers) │
│    Implementación acotada en branch aislada + unit tests    │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 4: QA Intake & Target Artifacts]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFICACIÓN Y CERTIFICACIÓN EMPÍRICA (QA Engineer)      │
│    Ejecución de suite completa + Evidence Provenance Matrix │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 5: QA Certification Report]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AUDITORÍA DE RELEASE READINESS (Release Manager)         │
│    Auditoría de Gates G0–G8 + Release Scope Diff            │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Handoff 6: Release Readiness Report]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. AUTORIZACIÓN FINAL DE DESPLIEGUE (Human Product Authority)│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Especificación de Handoffs Inter-Agencia

### Handoff 1: Commercial Signal → Governance (`Growth → Foundation Guardian`)
- **Documento:** `Product Feedback Handoff`.
- **Estructura Obligatoria:**
  ```markdown
  # Product Feedback Handoff: [Feature Name]
  - **Contexto de Mercado:** [Descripción de la señal detectada]
  - **Source IDs:** [FACT-xxx, CUSTOMER SIGNAL-xxx]
  - **Hipótesis Comercial:** [Dolor resuelto y beneficio estimado]
  - **Límites Declarados:** "Señal informativa; no constituye orden de desarrollo."
  ```

### Handoff 2: Governance Mandate → Architecture (`Foundation Guardian → Software Architect`)
- **Documento:** `Governance Assessment & Mandate`.
- **Estructura Obligatoria:**
  ```markdown
  # Governance Mandate: [Feature Name]
  - **Dictamen:** ALLOW / ALLOW WITH CONDITIONS / ADR REQUIRED
  - **Invariantes L0/L1:** [Condiciones de seguridad, RLS y Core/Instance boundary]
  - **Alcance del Mandato:** Autorización para diseñar arquitectura y redactar ADR.
  ```

### Handoff 3: Technical Design → Engineering (`Software Architect → Engineers`)
- **Documento:** `Technical Specification & ADR`.
- **Estructura Obligatoria:**
  ```markdown
  # Technical Specification: [Feature Name]
  - **ADR Vinculante:** docs/adr/ADR-xxxx-[name].md
  - **Capabilities Afectadas:** [can('...')]
  - **Modelo de Datos:** [Tablas, columnas, índices, RLS policies]
  - **Contratos de API:** [Zod schemas, requests, responses, errores]
  - **Dependencias Externas:** [Resueltas / PROVEN; si UNKNOWN → STRICT STOP]
  ```

### Handoff 4: Implementation Intake → QA (`Engineers → QA Engineer`)
- **Documento:** `Implementation Intake & Diff Inventory`.
- **Estructura Obligatoria:**
  ```markdown
  # Implementation Intake: [Feature Name]
  - **Branch:** feat/[feature-name]
  - **Archivos Modificados:** [Lista exhaustiva en src/ y supabase/]
  - **Tests Unitarios Creados:** [tests/unit/...]
  - **Comandos de Validación:** npm run test:unit, npm run typecheck, npm run lint
  ```

### Handoff 5: QA Certification → Release (`QA Engineer → Release Manager`)
- **Documento:** `QA Certification Report`.
- **Estructura Obligatoria:**
  ```markdown
  # QA Certification Report: [Feature Name]
  - **Resultado Final:** CERTIFIED / CERTIFIED WITH CONDITIONS / BLOCKED / FAILED
  - **Evidence Matrix:** [Tests ejecutados, cobertura, validación RLS y tenant isolation]
  - **Auditoría de Tautologías:** 0 tests vacuos o triviales detectados.
  ```

### Handoff 6: Release Readiness → Human (`Release Manager → Human Authority`)
- **Documento:** `Release Readiness Report`.
- **Estructura Obligatoria:**
  ```markdown
  # Release Readiness Report: [Feature Name]
  - **Decisión:** RELEASE READY / RELEASE READY WITH CONDITIONS / NOT RELEASE READY / BLOCKED
  - **Auditoría de Gates (G0–G8):** [Tabla de cumplimiento estricto]
  - **Diff Auditado:** [git status, git diff --stat]
  - **Límite:** "Requiere aprobación humana explícita para merge/deploy a producción."
  ```

---

## 4. Estándar de Decisión Comercial y Técnica

Toda decisión importante debe redactarse bajo el marco estándar:

```markdown
## Decision Record

### 1. Objective & Context
[Qué problema se aborda y por qué]

### 2. Evidence (FACT / PROVEN)
[Datos empíricos comprobables y Source IDs]

### 3. Evaluated Options
- Opción A: [Descripción, ventajas, desventajas]
- Opción B: [Descripción, ventajas, desventajas]

### 4. Selected Decision & Rationale
[Decisión adoptada y fundamentación técnica/estratégica]

### 5. Identified Risks & Mitigations
[Riesgos de seguridad, performance o deuda técnica]

### 6. Boundary Assessment (Core vs. Instance)
[Confirmación de que no se contamina el Core genérico]

### 7. Decision Owner & Approval Status
[Rol responsable y estado de aprobación]
```
