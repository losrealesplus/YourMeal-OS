# RI-001 Operational Readiness Backlog

**Nombre oficial:** RI-001 Operational Readiness Backlog  
*(no “Stabilization Backlog” — el cuello de botella ya no es infraestructura; es evidencia operacional)*  

**Epic marco:** EP-OPS-001 · RI-001 Operational Certification  
**Gate:** [CG-RI-001](../10-validation/reports/RI001_CERTIFICATION_REPORT.md) — Certification Report  
**Pregunta maestra de cada tarea:**

> **¿Qué evidencia falta para poder certificar que YourMeal OS opera una empresa real?**

**Método:** [OPERATIONAL_READINESS_CERTIFICATION](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) · [FCR_SESSION_LOG](../10-validation/FCR_SESSION_LOG.md) · [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md)

---

## Organización

No por áreas técnicas (Auth, UX, Render…).  
Por **bloques de certificación operacional**.

```text
A Foundation
 ↓
B Surfaces
 ↓
C Department Workspaces
 ↓
D Operational Language
 ↓
E RBAC & Operational Access
 ↓
F Observability Readiness
 ↓
G Flow Certification
 ↓
H Authentication Transition
 ↓
I RI-001 Certification Report  →  READY | READY WITH OBSERVATIONS | NOT READY
```

---

## Reglas transversales (cada bloque)

Al **cerrar** cada bloque:

### REVALIDATION CHECK · superficies

```text
¿Este bloque modificó otra superficie?
NO → Continuar
SÍ → Revalidar únicamente la(s) superficie(s) afectada(s)
```

### REVALIDATION CHECK · flujos

```text
¿Este bloque modificó un flujo certificado?
NO → Continuar
SÍ → Recertificar únicamente ese flujo
```

No recorrer todo el sistema por una corrección localizada.

### Disciplina

- No corregir mientras se inspecciona (dentro de un bloque de evidencia).
- No abrir conceptos metodológicos nuevos en medio de un bloque.
- Toda observación → evidencia + clasificación (Surface Gap / Flow Gap / Render Stability / …).

---

## Bloque A · Foundation Validation

**Objetivo:** confirmar que la base sobre la que se certifica no ha cambiado.

| Ítem | Evidencia / artefacto | Estado |
|------|------------------------|--------|
| Identity Frozen v1 | [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) | □ |
| Infrastructure Stable | INFRA / DV-001 · [DEPLOYMENT_VERIFICATION](../10-validation/DEPLOYMENT_VERIFICATION.md) | □ |
| PRE-CHECK (P12) | [Evidence Freshness](../20-evidence-framework/10-evidence-freshness-p12.md) | □ |
| Bloqueadores abiertos | Lista explícita + severidad | □ |

**Salida:** Foundation Certified ✅

---

## Bloque B · Surface Certification

Certificar cada superficie como unidad independiente.

| Superficie | Surface Status |
|------------|:--------------:|
| Tenant Surface `/admin` | **IN REVIEW** |
| Platform Surface `/saas` | NOT STARTED |
| Customer Surface `/app` | NOT STARTED |

**CERTIFIED** solo tras validación completa (jornadas + Operación completada + sin P0/P1 abiertos).  
Ver [ORC · Surface Certified](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md).

**Salida:** las tres superficies CERTIFIED (o waiver explícito de alcance piloto).

---

## Bloque C · Department Workspace Certification

No se revisan pantallas: se certifica que el **departamento puede operar**.

| Workspace | Estado |
|-----------|:------:|
| Kitchen | Pendiente |
| Delivery | Pendiente |
| Support | Pendiente |
| Accounting | Pendiente |
| Operations (Company Admin hub) | Pendiente |

Pregunta: *¿Puede este departamento terminar su jornada laboral solo con YourMeal OS?*  
(Workspace Entry Policy · [WORKSPACE_ENTRY_POLICY](../10-validation/WORKSPACE_ENTRY_POLICY.md))

**Salida:** workspaces del alcance piloto CERTIFIED.

---

## Bloque D · Operational Language Review

Consistencia del lenguaje operativo entre docs, UI y modelo.

Ejemplos a alinear: Workspace · Intake · Order · Production · Dispatch · Route · Batch · Delivery · Customer · Order Source · Demand Channel.

**Salida:** lenguaje coherente (DICT / OM / UI) — lista de divergencias cerrada o aceptada.

---

## Bloque E · RBAC & Operational Access

**Separado de Auth.** No reabre Identity Freeze.

Certificar:

- cada rol accede solo a su superficie;
- permisos correctos;
- sin accesos cruzados Tenant ↔ Platform indebidos.

Artefactos: [RBAC_MATRIX_V1](../10-validation/RBAC_MATRIX_V1.md) · FCR-001.

**Salida:** access map verificado + hallazgos clasificados.

---

## Bloque F · Observability Readiness

**Sin añadir observabilidad nueva** en este bloque.

Validar que las operaciones críticas dejan evidencia suficiente:

| Campo | Presente |
|-------|:--------:|
| Actor | □ |
| Timestamp | □ |
| Tenant | □ |
| Superficie | □ |
| Canal (Order Source, si Intake) | □ |
| Operación | □ |

**Salida:** Observability Ready for certification (gaps listados, no features nuevas).

---

## Bloque G · Flow Certification

Recorridos completos (Nivel 2). Plantilla: [FLOW_CERTIFICATION](../10-validation/FLOW_CERTIFICATION.md).

Ejemplos / mapeo:

| Flujo | Evidencia |
|-------|-----------|
| Cliente → Pedido | A / B |
| Cocina → Producción | G / workspace Kitchen |
| Producción → Reparto | Flow Gap check |
| Reparto → Entrega | A / Delivery |
| Soporte → Incidencia | C |

Cada flujo genera evidencia para CG-RI-001.  
Surface Gaps ≠ Flow Gaps.

**Salida:** Flow Certification PASS (A/B/C + handovers críticos).

---

## Bloque H · Authentication Transition

Separado del resto. No mezclar con Foundation ni con FCR Bootstrap.

| Sub-bloque | Objetivo | Cuándo |
|------------|----------|--------|
| **AUTH-A** | Recuperar flujo real de autenticación (necesario para escenarios finales) | Tras superficies/flujos de evidencia bajo Bootstrap si aplica |
| **AUTH-B** | Eliminar bootstrap / smoke force temporal | **Solo** cuando flujos críticos estén certificados |

Identity Freeze sigue: bug/security/provider activation — no rediseño Auth.

**Salida:** Auth producción operable · adaptador de desarrollo OFF en el entorno de certificación final.

---

## Bloque I · RI-001 Certification Report

**No se desarrolla nada.** Solo se decide con evidencia.

| Veredicto | Significado |
|-----------|-------------|
| **READY** | Evidencias respaldan operación real |
| **READY WITH OBSERVATIONS** | Operable con observaciones aceptadas |
| **NOT READY** | Brechas P0/P1 o flujos críticos incompletos |

Plantilla: [RI001_CERTIFICATION_REPORT](../10-validation/reports/RI001_CERTIFICATION_REPORT.md).

**Salida:** decisión CG-RI-001 firmada.

---

## Estado resumen

| Bloque | Nombre | Estado |
|--------|--------|--------|
| A | Foundation Validation | Pendiente / en curso |
| B | Surface Certification | Tenant IN REVIEW · resto NOT STARTED |
| C | Department Workspaces | Pendiente |
| D | Operational Language | Pendiente |
| E | RBAC & Operational Access | Pendiente (FCR-001 abierto) |
| F | Observability Readiness | Pendiente |
| G | Flow Certification | Plantilla lista · no ejecutar aún |
| H | Authentication Transition | Diferido (AUTH-A/B) |
| I | Certification Report | Diferido |

---

## Relación con artefactos vivos

| Artefacto | Bloques |
|-----------|---------|
| FCR Session Log · Pasada 2 | B · C · E |
| FLOW_CERTIFICATION | G |
| Order Intake ADR 0017 | D (lenguaje) · F (canal) · G (Cliente→Pedido) |
| ORR READY | consecuencia de B+G + sin P0/P1 → luego I / ORR formal |
