# EP-OPS-003 · Workspace Operational Journey Certification

**Estado:** OPEN · NOT STARTED (scaffolding)  
**Fecha apertura:** 2026-07-28  
**Programa:** RI-001 · Bloque C (jornadas)  
**Prerrequisito:** EP-OPS-002 · Entry architecture **CERTIFIED**  
`(RBAC-001 · WEP-001 · LP-001)` — PR #88 · [WORKSPACE_ENTRY_POLICY](../10-validation/WORKSPACE_ENTRY_POLICY.md)  

```text
Identity
    ↓
Surface
    ↓
Workspace                    ← Entry CERTIFIED (EP-OPS-002)
    ↓
Operational Journey          ← ESTE EPIC (EP-OPS-003)
    ↓
Operational Outcome
    ↓
Cross-Department Flow        ← Bloque G (después)
    ↓
Operational Readiness
```

---

## Cadena metodológica

| Nivel | Epic / bloque | Qué certifica |
|-------|---------------|---------------|
| **Entry** | EP-OPS-002 | El usuario entra donde corresponde |
| **Journey** | **EP-OPS-003** | El usuario completa su trabajo **dentro** del Workspace |
| **Flow** | RI-001 Bloque G | Los departamentos colaboran / se traspasan información |
| **Readiness** | ORR / CG-RI-001 | La empresa opera como sistema |

Entry ≠ Journey ≠ Flow. No mezclar gaps de navegación con gaps operacionales ni con handoffs.

---

## Contexto

La arquitectura de entrada está certificada. Todo usuario autenticado llega de forma determinista a su Surface y Workspace.

**Este epic no certifica el acceso.**  
**Certifica la operación interna de cada Workspace.**

Pregunta maestra por workspace:

> ¿Puede este departamento completar de principio a fin sus tareas críticas sin abandonar su Workspace y sin depender de funcionalidades de otras superficies?

---

## Objetivo

Validar que cada Workspace soporta el trabajo operativo para el que fue diseñado — siguiendo la **cadena natural de valor** del meal prep.

---

## Orden de certificación (cadena de valor)

```text
Kitchen → Delivery → Support → Accounting
```

| # | Workspace | Por qué este orden | Outcome esperado |
|---|-----------|--------------------|------------------|
| 1 | **Kitchen** | Origen de la operación | **Production Ready** |
| 2 | **Delivery** | Depende de producción certificada | **Orders Delivered** |
| 3 | **Support** | Valor cuando hay pedidos entregados | **Issues Resolved** |
| 4 | **Accounting** | Economía depende de la operación previa | **Financial Records Complete** |

No certificar Delivery si Kitchen no está certificado.  
No certificar Support sin base de pedidos/entregas.  
Accounting es el último: sin operación previa no hay registros financieros reales (P13 · No Artificiality).

---

## Workspaces en alcance

| Workspace | Landing | Outcome | Gate | Estado |
|-----------|---------|---------|:----:|--------|
| Kitchen | `/admin/kitchen` | Production Ready | **OBSERVATIONS** | **CERTIFIED** |
| Delivery | `/admin/delivery` | Orders Delivered | — | NOT STARTED · **NEXT** |
| Support | `/admin/support` | Issues Resolved | — | NOT STARTED |
| Accounting | `/admin/accounting` | Financial Records Complete | — | NOT STARTED |

### Progress

```text
Kitchen      CERTIFIED · OBSERVATIONS · Production Ready
Delivery     NOT STARTED  ← siguiente
Support      NOT STARTED
Accounting   NOT STARTED
Journeys     1/4 (25%)
```

Evidencia Kitchen: [ep-ops-003/kitchen/](../10-validation/ep-ops-003/kitchen/)


Operations Center (`/admin`) = hub Company Admin / Ops Manager — fuera del núcleo EP-OPS-003 salvo observaciones de handoff.

---

## Jornadas objetivo

### Kitchen → Production Ready

```text
Recepción de producción → Lista de preparación → Producción
  → Finalización → Disponible para Delivery
```

### Delivery → Orders Delivered

```text
Pedidos preparados → Asignación → Ruta → Entrega → Confirmación → Cierre
```

### Support → Issues Resolved

```text
Recepción de incidencia → Clasificación → Seguimiento → Resolución → Cierre
```

### Accounting → Financial Records Complete

```text
Facturación → Cobros → Conciliación → Estado financiero → Cierre
```

---

## Plantilla por Workspace (obligatoria)

| Sección | Pregunta |
|---------|----------|
| Objetivo operacional | ¿Qué problema resuelve? |
| Actor principal | ¿Quién trabaja aquí? |
| Entradas | ¿Qué recibe? |
| Proceso | ¿Qué operaciones ejecuta? |
| Salidas / Outcome | ¿Qué produce? (ver tabla Outcomes) |
| Dependencias | ¿Qué información necesita? |
| Restricciones | ¿Qué NO puede hacer? |
| Casos negativos | ¿Errores / accesos no permitidos? |

Artefactos: [ep-ops-003/](../10-validation/ep-ops-003/README.md)

---

## Evidence Gate (por Workspace)

```text
PASS            → journey completo · críticas OK · outcome alcanzado · sin bloqueos · límites claros · negativos OK · evidencia reproducible
OBSERVATIONS    → operable con hallazgos no bloqueantes documentados
FAIL            → bloqueo operacional o evidencia insuficiente (P13)
```

**CERTIFIED** solo con Gate **PASS** (OBSERVATIONS aceptadas solo vía Certification Report explícito).

---

## Tras los cuatro packs

Cuando Kitchen · Delivery · Support · Accounting cierren Gate:

```text
Departamentos aislados CERTIFIED
        ↓
Empresa como sistema
        ↓
Bloque G · Flow Certification
```

Flow responde: ¿se transfiere la información? ¿trazabilidad del pedido? ¿bloqueos entre áreas?  
EP-OPS-003 = funcionamiento **interno**; Bloque G = funcionamiento **transversal**.

---

## Restricciones del epic

| Permitido | Prohibido |
|-----------|-----------|
| Certificar jornadas existentes | Features nuevas solo “para pasar el gate” |
| Corregir bloqueos hallados en cert | Reabrir Auth / Identity / RBAC model |
| Anotar Flow Gap candidatos → Bloque G | Ejecutar Flow Certification aquí |
| Actualizar Progress al cerrar cada gate | Marcar Bloque C PASS sin las 4 jornadas |

---

## Resultado al cerrar el epic

- RI-001 Progress · Bloque C  
- ORC / Operational Readiness  
- Evidence Gates por workspace  
- Certification Report (cuando proceda)  
- Desbloqueo de **Bloque G · Flow**

```text
EP-OPS-002 → Entry
EP-OPS-003 → Journey
Bloque G   → Flow
ORR        → Operational Readiness
```
