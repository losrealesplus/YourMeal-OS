# 08 · Evidence Framework — FOPEBA

**Documento madre** del framework de evidencia.

FOPEBA no es un framework para desarrollar software.  
Es un framework para **descubrir, certificar y gobernar conocimiento operacional** — y solo después usarlo para desarrollar software.

El rasgo distintivo: la **cadena de evidencia**.

---

## Principio post-freeze

> **Una vez congelada la metodología, el conocimiento solo puede evolucionar mediante evidencia observacional suficiente.**

Forma corta: la única forma de avanzar es obteniendo evidencia de campo.  
Hito: [Methodology Frozen](../00-status/04-methodology-frozen.md).

---

## Tres capas de artefactos

```text
Knowledge Artifacts     → qué afirmamos saber (modelo, UL, invariants…)
        ↓
Evidence Artifacts      → qué observamos / validamos (FO, IVR, VS…)
        ↓
Decision Artifacts      → qué decidimos con esa evidencia (KUR, ECR, Acta G-01…)
```

| Capa | Ejemplos |
|------|----------|
| **Knowledge** | Operational Model · Known Limitations · UL |
| **Evidence** | FO · FER · IVR · VS · OVI mediciones |
| **Decision** | KUR · ECR · Gate Acta · Open Risks aceptados · Decision Records |

KUR / ECR / Actas **no** son conocimiento ni evidencia: son **decisiones** gobernadas.

---

## Tres grandes etapas

```text
FASE A — Knowledge Discovery
Foundation · Blueprint · Discovery · Checks
        ↓
FASE B — Knowledge Certification
Operational Model · Operational Validation · IOV
FOV · Knowledge Update · Economic Confirmation · Gate G-01
        ↓
FASE C — Product Engineering
Architecture · Implementation · Verification · Release
```

| Fase | Pregunta | YourMeal OS hoy |
|------|----------|-----------------|
| **A** | ¿Qué ocurre y qué se decide? | ✅ |
| **B** | ¿Table-Validated → Field-Validated? | RC Table-Validated ✅ · FOV ⏳ |
| **C** | ¿Cómo traducimos ese conocimiento a software? | 🔒 G-01 |

---

## Familias de evidencia

| Familia | Fase | Qué demuestra |
|---------|------|---------------|
| Documental / Discovery | A | Qué ocurre y qué se decide |
| Conceptual (mesa) | B · Validation | El modelo explica bajo refutación propia |
| Transferencia / resistencia / determinismo | B · IOV | Sobrevive sin el autor |
| **Pilot Integrity (G-02)** | B · pre-FOV | El Journey mínimo es íntegro para exponer la RI a realidad |
| Empírica | B · FOV | La operación real produce / tensiona |
| Gobernanza del cambio | B · KU | Cómo cambia el conocimiento certificado |
| Valor | B · EC | ¿El conocimiento genera valor medible? |
| Readiness | B · G-01 | ¿Suficiente para Etapa C? |

---

## Estructura de este directorio

```text
08 · Evidence Framework
│
├── 01 Knowledge States
├── 02 Evidence Confidence Levels (ECL)
├── 03 Stability Index
├── 04 FOV + fov/
├── 05 Knowledge Update + ku/   (KU-01 · 02 · 03)
├── 06 Economic Confirmation + ec/  (Framework · OVI · ECR)
├── 07 Gate G-01 + g01/         (Package · Decision · Acta)
├── 08 Gate G-02                (Pilot Readiness · RI)
├── 09 Operational Visibility   (cero humo · DICT-071)
└── 10 P12 Evidence Freshness   (PRE-CHECK · STALE)
```

| Doc | Contenido |
|-----|-----------|
| [01 KS](./01-knowledge-states.md) | Estado del conocimiento |
| [02 ECL](./02-evidence-confidence-levels.md) | Calidad de evidencia |
| [03 Stability](./03-stability-index.md) | S0…S3 |
| [04 FOV](./04-field-operational-validation.md) · [fov/](./fov/README.md) | Evidencia empírica |
| [05 KU](./05-knowledge-update.md) · [ku/](./ku/README.md) | Gobernanza del cambio |
| [06 EC](./06-economic-confirmation.md) · [ec/](./ec/README.md) | Valor operacional |
| [07 G-01](./07-gate-g01-operational-readiness.md) · [g01/](./g01/README.md) | Certificación Stage 2 |
| [08 G-02](./08-gate-g02-pilot-readiness.md) | Pilot Readiness · integridad del Journey |
| [09 Visibility](./09-operational-visibility-principle.md) | Cero humo · lo visible existe |
| [10 P12 Freshness](./10-evidence-freshness-p12.md) | Evidencia vigente antes de ingeniería · STALE |

---

## Secuencia FASE B (cierre)

En una **Reference Implementation** (RI), G-02 autoriza el experimento de campo **antes** de FOV/KU/EC/G-01:

```text
Operational Journey Closed · ORR Signed
    → Gate G-02 (Pilot Readiness)
    → Pilot · Evidence Collection
    → FOV (FO) → FER
    → Knowledge Update (KUR)
    → Economic Confirmation (OVI · ECR)
    → Gate G-01 (Package → Decision)
    → FASE C Product Engineering (si aplica)
```

Orden de **construcción metodológica** (ya aplicado): KU → EC → G-01.  
Orden de **ejecución en RI**: G-02 → Pilot → FOV → KU → EC → G-01.

---

## Regla de diseño

> **Cada nueva fase debe eliminar una incertidumbre que ninguna fase anterior pueda eliminar.**

---

## Glosario

| Sigla | Significado |
|-------|-------------|
| **FOV** / **FO** / **FER** | Campo · Observation · Evidence Review |
| **KU** / **KUR** / **KC** | Knowledge Update · Report · Candidate |
| **EC** / **OVI** / **ECR** | Economic Confirmation · Value Indicators · Report |
| **G-01** | Operational Readiness Gate |
| **G-02** | Pilot Readiness Gate (integridad del Journey · RI) |
| **ECL** / **S0…S3** | Confidence · Stability |
| **RI** | Reference Implementation |

---

## Relacionado

- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [Estado](../00-status/README.md)
