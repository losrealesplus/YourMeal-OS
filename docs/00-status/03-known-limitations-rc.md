# Known Limitations — Operational Model RC (Knowledge Certified)

**Publicado con:** [Operational Model RC](./02-operational-model-rc.md) · 2026-07-22

> Esto sabemos con evidencia.  
> Esto **todavía no** afirmamos saber.

FOV debe confirmar o ampliar estos límites — no explorar sin dirección.

---

## 1. Tipos de operación no afirmados como cubiertos «de fábrica»

| Límite | Evidencia | Qué haría FOV |
|--------|-----------|---------------|
| Inbound finished goods **cross-Organization** sin Batch local | SF-001 Extended | ¿Receive-and-portion / Stock de producto terminado basta en campo? |
| Servery / canteen sin vehículo | SF-003 Clarified | ¿Route=ventana + Delivery=mostrador se observa naturalmente? |
| Dual payer (dos Company Accounts, un Beneficiary) | SF-004 Extended | ¿Invoice/funding path o tensión real con INV-015? |
| Prescripción clínica como autoridad externa al Menu | SF-005 Resisted Core | ¿Beneficiary+Order Item+Checks bastan en hospital real? |
| Cook-chill multi-hop regenerate | SF-006 Resisted | ¿Dos ciclos espina vía Stock se narran en cocina real? |

---

## 2. Hipótesis pendientes de FOV

| Hipótesis | Confirmación esperada |
|-----------|----------------------|
| Happy Path B2B se produce espontáneamente | FOR alineados a Menu→…→Payment |
| Amend / Pause / Hold aparecen sin forzar vocabulario | Dynamics en lenguaje de cocina |
| Checks MANUAL DECISION reflejan decisiones reales | INV-043 en campo |
| Tiempos / errores / preguntas eliminables | Entrada a Economic Confirmation |

---

## 3. Deliberadamente fuera del Core

| Decisión | Dónde vive | Por qué |
|----------|------------|---------|
| DietPrescription / EmergencyOrder / Ward | Config / Order Item / Location | Filtro Core · SF-005 |
| Shift / Wave / Super-Route | Ventana + Resource | MC-005 · VR-005 |
| Recall como Core | Lot + Hold + eventos | MC-003 |
| Notification / Dashboard | Capabilities | INV-044 |
| Motores Order/Plan/Batch/Route | Etapa 2 post G-01 | Dual track Carril B |

---

## 4. Confianza del RC

| Fase | Confianza |
|------|----------:|
| Operational Validation | Muy alto |
| IOV-001 | Alto |
| IOV-002 | Muy alto |
| IOV-003 | Alto (equivalencia conceptual) |

Siguiente juez: **operación real**.
