# Operational Readiness Certification · metodología FCR→ORR

**Estado:** Accepted as working method (Functional Review Mode)  
**No sustituye** el ORR binario de producto ([ORR](../22-implementation/ORR.md) · PASSED / BLOCKED).  
**Criterio RI-001:** demostrar operación completa EatClean — no solo módulos ni perfiles aislados.  
**Backlog activo:** [RI-001 Operational Readiness Backlog](../00-status/RI001_OPERATIONAL_READINESS_BACKLOG.md) (bloques A→I · no “stabilization”).

---

## Cadena (Construcción ≠ Certificación)

```text
RI → KC → SPEC
────────────
Construcción
────────────
 ↓
FCR   (certificación)
 ↓
ORR   (certificación · ¿liberar producto?)
 ↓
RELEASE
```

Cuando alguien dice «estamos en FCR» significa: **demostramos que lo desarrollado funciona operacionalmente** — no «seguimos desarrollando».

---

## Dos niveles de certificación → tres capas

```text
Nivel 0 · Entry Certification          ← EP-OPS-002 · CERTIFIED
        Identity → Surface → Workspace
        ↓
Nivel 1 · Workspace Operational Journey ← EP-OPS-003 · activo
        Workspace → Journey → Outcome
        ↓
Nivel 2 · Operational Flow Certification ← FLOW_CERTIFICATION · después
        Traspasos entre departamentos
        ↓
ORR READY
        ↓
ORR (PASSED | BLOCKED)
```

### Nivel 0 · Entry Certification (hecho)

Pregunta: *¿El usuario entra en la superficie y workspace correctos?*  
Artefactos: RBAC-001 · WEP-001 · LP-001 · EP-OPS-002 (PR #88) · [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md).

### Nivel 1 · Workspace Operational Journey (ahora)

Pregunta:

> ¿Este departamento puede completar su jornada operativa sin salir de su Workspace?

Ejemplo Kitchen: Recepción → Preparación → Producción → Finalización → Disponible Delivery.

Plantillas: [ep-ops-003/](./ep-ops-003/README.md) · Epic [EP-OPS-003](../00-status/EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md) · **[Methodology FROZEN](../00-status/EP_OPS_003_METHODOLOGY_FROZEN.md)**.

Cuando el Gate del workspace = PASS u OBSERVATIONS (aceptadas) → Workspace Journey **CERTIFIED**.

**FOPEBA:** CERTIFIED = Outcome operacional demostrado. OBSERVATIONS = seguimiento documentado, no denegación del Journey.

**Continuidad:** el Outcome de un Journey es el Input del siguiente (metodología congelada).

**Kitchen (2026-07-28):** CERTIFIED · Gate OBSERVATIONS · Outcome **Production Ready**  
Evidencia: [ep-ops-003/kitchen/](./ep-ops-003/kitchen/).  
**Siguiente:** Support · Input = Orders Delivered · Outcome = Issues Resolved · **ejecutar, no redefinir**.

**Delivery (2026-07-28):** CERTIFIED · Gate OBSERVATIONS · Outcome **Orders Delivered**  
Evidencia: [ep-ops-003/delivery/](./ep-ops-003/delivery/).

### Nivel 2 · Operational Flow Certification

Cuando las jornadas del alcance estén CERTIFIED, **no** ir directo a ORR.

Antes: **3 recorridos** que simulan el negocio real (pedido normal · personalizado · incidencia).

Plantilla: [FLOW_CERTIFICATION.md](./FLOW_CERTIFICATION.md).

Pregunta:

> ¿Puede EatClean completar una operación de extremo a extremo entre departamentos?

---

## Surface Gap vs Flow Gap vs Journey Gap

| Tipo | Definición | Ejemplo |
|------|------------|---------|
| **Entry Gap** | No aterriza en el workspace correcto | Support cae en `/admin` genérico |
| **Journey Gap** (Surface Gap de jornada) | No puede completar su trabajo en el workspace | Kitchen no cierra un lote |
| **Flow Gap** | Workspaces OK por separado; falla el traspaso | Kitchen finaliza → Delivery no recibe información |

Una Journey Gap es brecha operacional de departamento.  
Una Flow Gap es brecha de **flujo entre departamentos** — prioridad alta para ORR aunque cada journey esté CERTIFIED.

---

## Lenguaje consolidado

| Concepto | Significado |
|----------|-------------|
| **Tenant Surface** `/admin` | Opera un negocio |
| **Platform Surface** `/saas` | Opera la plataforma |
| **Workspace Entry Policy** | Dónde empieza (≠ RBAC) |
| **Render Stability Regression** | Clase de defecto (síntoma ≠ causa) |
| **Brecha operacional** | La jornada / el flujo no puede completarse |

---

## Regla · síntoma ≠ causa

> Nunca registrar un síntoma como si fuera la causa.

---

## Surface Status (estado local)

Responde: *¿Cuál es el estado de esta superficie?*

| Status | Significado |
|--------|-------------|
| NOT STARTED | Sin FCR |
| IN REVIEW | En curso / P0–P1 abiertos |
| CERTIFIED | Criterios Nivel 1 cumplidos |
| REGRESSED | P0/P1 nuevo tras CERTIFIED |

### Criterios Surface Certified

1. Jornada de trabajo recorrida (no solo pantallas).
2. **Operación completada** donde aplique.
3. Escenarios límite: sin datos · ya completado · superficie incorrecta.
4. Sin P0; sin P1 abiertos (salvo waiver).
5. P2 aceptados o corregidos.
6. Evidencia en Session Log.

---

## ORR READY (estado global · objetivo)

Responde: *¿Puede liberarse el producto hacia ORR formal?*

**ORR READY** cuando:

1. Todas las superficies del alcance piloto están **CERTIFIED**.
2. No existen brechas operacionales **P0/P1** abiertas (Surface Gap ni Flow Gap).
3. Los **flujos operacionales críticos** (A · B · C) han sido completados con evidencia ([FLOW_CERTIFICATION](./FLOW_CERTIFICATION.md)).

```text
Surfaces CERTIFIED
        +
Flow Certification PASS
        +
Sin brechas P0/P1
        ↓
ORR READY
        ↓
ORR formal → PASSED | BLOCKED
```

ORR deja de ser opinión: es consecuencia de evidencia de superficie + flujo.

---

## Pasada 2 · ahora (solo Nivel 1)

* 7 perfiles · jornadas completas · evidencia · **sin corregir** durante la pasada.  
* Pregunta: *¿Puede terminar su jornada laboral solo con YourMeal OS?*  
* Si no → Surface Gap / brecha operacional.  
* Observar categorías (sin SPEC): Acceso · Ejecución · Información · Cierre.  
* Dejar [FLOW_CERTIFICATION.md](./FLOW_CERTIFICATION.md) vacío hasta cerrar superficies.

---

## Anotaciones (sin SPEC / sin nombre oficial)

**Operational Journey (modelo futuro):** Entry → Workspace → Actions → Completion → Exit  

**Categorías de brecha (observar):** Acceso · Ejecución · Información · Cierre  

**Capa emergente:** Operational Knowledge → Operational Certification → Operational Release  

---

## Relación con artefactos

| Artefacto | Nivel |
|-----------|-------|
| [FCR_FINDINGS_REGISTER](./FCR_FINDINGS_REGISTER.md) | Hallazgos / Surface Gaps |
| [FCR_SESSION_LOG](./FCR_SESSION_LOG.md) | Evidencia Nivel 1 |
| [FLOW_CERTIFICATION](./FLOW_CERTIFICATION.md) | Evidencia Nivel 2 (plantilla) |
| [RBAC_MATRIX_V1](./RBAC_MATRIX_V1.md) | Autorización |
| [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) | Landings |
| [ORC](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) | Método Surface + Flow |
| [RI-001 Ops Readiness Backlog](../00-status/RI001_OPERATIONAL_READINESS_BACKLOG.md) | Bloques A→I hacia CG-RI-001 |
| [ORR](../22-implementation/ORR.md) | Puerta binaria tras ORR READY |
