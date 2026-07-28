# EP-OPS-003 · Workspace Operational Journey Certification

**Estado:** OPEN · NOT STARTED (scaffolding)  
**Fecha apertura:** 2026-07-28  
**Programa:** RI-001 · Bloque C (jornadas)  
**Prerrequisito:** EP-OPS-002 · Entry architecture **CERTIFIED**  
`(RBAC-001 · WEP-001 · LP-001)` — PR #88 · [WORKSPACE_ENTRY_POLICY](../10-validation/WORKSPACE_ENTRY_POLICY.md)  

```text
Identity → Surface → Workspace     ← CERTIFIED (EP-OPS-002)
Workspace → Operational Journey → Operational Outcome   ← ESTE EPIC
```

---

## Contexto

La arquitectura de entrada está certificada. Todo usuario autenticado llega de forma determinista a su Surface y Workspace.

**Este epic no certifica el acceso.**  
**Certifica la operación.**

Pregunta maestra por workspace:

> ¿Puede este departamento completar de principio a fin sus tareas críticas sin abandonar su Workspace y sin depender de funcionalidades de otras superficies?

---

## Objetivo

Validar que cada Workspace soporta el trabajo operativo para el que fue diseñado.

```text
Antes (certificado)          Ahora (este epic)
─────────────────            ─────────────────
Surface                      Workspace
  ↓                            ↓
Workspace                    Operational Journey
                               ↓
                             Operational Outcome
```

---

## Workspaces en alcance

| Workspace | Landing | Gate | Estado |
|-----------|---------|:----:|--------|
| Kitchen | `/admin/kitchen` | — | NOT STARTED |
| Delivery | `/admin/delivery` | — | NOT STARTED |
| Support | `/admin/support` | — | NOT STARTED |
| Accounting | `/admin/accounting` | — | NOT STARTED |

Operations Center (`/admin`) no es un departamento de ejecución: se valida solo como hub de Company Admin / Ops Manager (fuera del núcleo EP-OPS-003 salvo observaciones de handoff).

---

## Jornadas objetivo

### Kitchen

```text
Recepción de producción → Lista de preparación → Producción
  → Finalización → Disponible para Delivery
```

### Delivery

```text
Pedidos preparados → Asignación → Ruta → Entrega → Confirmación → Cierre
```

### Support

```text
Recepción de incidencia → Clasificación → Seguimiento → Resolución → Cierre
```

### Accounting

```text
Facturación → Cobros → Conciliación → Estado financiero → Cierre
```

---

## Plantilla por Workspace (obligatoria)

Para cada workspace documentar y evidenciar:

| Sección | Pregunta |
|---------|----------|
| Objetivo operacional | ¿Qué problema resuelve? |
| Actor principal | ¿Quién trabaja aquí? |
| Entradas | ¿Qué recibe? |
| Proceso | ¿Qué operaciones ejecuta? |
| Salidas | ¿Qué produce? |
| Dependencias | ¿Qué información necesita? |
| Restricciones | ¿Qué NO puede hacer? |
| Casos negativos | ¿Errores / accesos no permitidos? |

Artefactos por workspace (carpeta `docs/10-validation/ep-ops-003/`):

- Operational Journey
- Workspace Validation
- Negative Cases
- Observaciones
- Riesgos
- Estado / Evidence Gate

---

## Evidence Gate (por Workspace)

```text
PASS            → recorrido completo · críticas OK · sin bloqueos · límites claros · negativos OK · evidencia reproducible
OBSERVATIONS    → operable con hallazgos no bloqueantes documentados
FAIL            → bloqueo operacional o evidencia insuficiente (P13)
```

Un Workspace es **CERTIFIED** solo con Gate **PASS** (o PASS con OBSERVATIONS aceptadas explícitamente en el Certification Report — no por defecto).

---

## Restricciones del epic

| Permitido | Prohibido |
|-----------|-----------|
| Certificar jornadas existentes | Nuevas features “para pasar el gate” sin hallazgo |
| Corregir bloqueos operacionales hallados en cert | Reabrir Auth / Identity / RBAC model |
| Documentar Surface Gap vs Flow Gap | Sustituir Flow Certification (Bloque G) |
| Actualizar Progress al cerrar cada workspace gate | Marcar Bloque C completo sin las 4 jornadas |

---

## Relación con metodología

| Nivel | Qué certifica | Artefacto |
|-------|---------------|-----------|
| Entry (hecho) | Cómo entra el usuario | EP-OPS-002 |
| **Workspace Journey (este)** | Cómo trabaja el departamento | **EP-OPS-003** |
| Flow (después) | Traspasos entre departamentos | FLOW_CERTIFICATION · Bloque G |

Ver [ORC](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md).

---

## Orden de ejecución sugerido

1. Kitchen  
2. Delivery  
3. Support  
4. Accounting  

Cerrar gate por workspace antes de avanzar (P13). Handoffs anotados como Flow Gap candidatos → Bloque G.

---

## Resultado al cerrar el epic

Actualizar:

- [RI-001 Progress](./RI001_OPERATIONAL_READINESS_BACKLOG.md) · Bloque C  
- Operational Readiness / ORC  
- Evidence Gates por workspace  
- [Certification Report](../10-validation/reports/RI001_CERTIFICATION_REPORT.md) (cuando proceda)

**Salida:** Bloque C jornadas = PASS → Language D / Flow G según backlog.
