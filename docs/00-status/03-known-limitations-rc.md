# Known Limitations — Operational Model RC (Table-Validated)

**Publicado con:** [Operational Model RC](./02-operational-model-rc.md) · 2026-07-22

> Esto sabemos con evidencia de **laboratorio**.  
> Esto **todavía no** afirmamos como Field-Validated.

Documento guía de la campaña [FOV](../20-evidence-framework/fov/README.md):

> ¿Cuáles de nuestras limitaciones conocidas siguen siendo ciertas y cuáles dejan de serlo?

Hipótesis operativas derivadas: [01-hypotheses-from-rc](../20-evidence-framework/fov/01-hypotheses-from-rc.md).

---

## 1. Tipos de operación no afirmados como cubiertos «de fábrica»

| Límite | Evidencia | Qué observar en FOV | H-FOV |
|--------|-----------|---------------------|-------|
| Inbound finished goods **cross-Organization** sin Batch local | SF-001 Extended | ¿Receive-and-portion / Stock de producto terminado basta? | H-01 |
| Servery / canteen sin vehículo | SF-003 Clarified | ¿Route=ventana + Delivery=mostrador se observa naturalmente? | H-02 |
| Dual payer (dos Company Accounts, un Beneficiary) | SF-004 Extended | ¿Invoice/funding path o tensión real con INV-015? | H-03 |
| Prescripción clínica como autoridad externa al Menu | SF-005 Resisted Core | ¿Beneficiary+Order Item+Checks bastan? | H-04 |
| Cook-chill multi-hop regenerate | SF-006 Resisted | ¿Dos ciclos espina vía Stock se narran en cocina? | H-05 |

---

## 2. Hipótesis pendientes de FOV

| Hipótesis | Evidencia esperada | H-FOV |
|-----------|--------------------|-------|
| Happy Path B2B se produce espontáneamente | FO alineados a Menu→…→Payment (lenguaje de cocina) | H-10 |
| Amend / Pause / Hold aparecen sin forzar vocabulario | Dynamics en incidentes reales | H-11 |
| Checks MANUAL DECISION reflejan decisiones reales | INV-043 en campo | H-12 |
| Tiempos / errores / preguntas eliminables | Entrada a Economic Confirmation (no fuerza KU) | H-13 |

---

## 3. Deliberadamente fuera del Core

| Decisión | Dónde vive | Por qué | H-FOV |
|----------|------------|---------|-------|
| DietPrescription / EmergencyOrder / Ward | Config / Order Item / Location | Filtro Core · SF-005 | H-04 |
| Shift / Wave / Super-Route | Ventana + Resource | MC-005 · VR-005 | H-20 |
| Recall como Core | Lot + Hold + eventos | MC-003 | H-21 |
| Notification / Dashboard | Capabilities | INV-044 | H-22 |
| Motores Order/Plan/Batch/Route | Etapa 2 post G-01 | Dual track Carril B | — |

---

## 4. Confianza del RC (laboratorio · Table-Validated)

| Fase | Confianza |
|------|----------:|
| Operational Validation | Muy alto |
| IOV-001 | Alto |
| IOV-002 | Muy alto |
| IOV-003 | Alto (equivalencia conceptual) |

Siguiente juez: **evidencia empírica** (FOV → FER) → camino a Field-Validated.
