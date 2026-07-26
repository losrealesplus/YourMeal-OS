# Operational Readiness Certification · metodología FCR→ORR

**Estado:** Accepted as working method (Functional Review Mode)  
**No sustituye** el ORR binario de producto ([ORR](../22-implementation/ORR.md) · PASSED / BLOCKED).  
**Criterio RI-001:** demostrar operación completa EatClean — no solo módulos ni perfiles aislados.

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

## Dos niveles de certificación

```text
Nivel 1 · Surface Certification     ← Pasada 2 (ahora)
        ↓
Nivel 2 · Operational Flow Certification  ← después · FLOW_CERTIFICATION.md
        ↓
ORR READY
        ↓
ORR (PASSED | BLOCKED)
```

### Nivel 1 · Surface Certification

Pregunta:

> ¿Este perfil puede completar su trabajo?

Ejemplo Kitchen: Entrar → Ver producción → Cambiar estados → Cerrar jornada.

Cuando se cumplen los criterios → Surface Status **CERTIFIED** (p. ej. jornada Kitchen / Tenant Surface según alcance).

Plantilla viva: [FCR_SESSION_LOG · Pasada 2](./FCR_SESSION_LOG.md#pasada-2--siete-perfiles).

### Nivel 2 · Operational Flow Certification

Cuando las superficies del alcance estén CERTIFIED, **no** ir directo a ORR.

Antes: **3 recorridos** que simulan el negocio real (pedido normal · personalizado · incidencia).

Plantilla (vacía hasta entonces): [FLOW_CERTIFICATION.md](./FLOW_CERTIFICATION.md).

Pregunta:

> ¿Puede EatClean completar una operación de extremo a extremo entre departamentos?

---

## Surface Gap vs Flow Gap

| Tipo | Definición | Ejemplo |
|------|------------|---------|
| **Surface Gap** | El usuario no puede completar su trabajo | Kitchen no cierra un lote |
| **Flow Gap** | Superficies OK por separado; falla el traspaso | Kitchen finaliza → Delivery no recibe información |

Una Surface Gap es brecha operacional de perfil.  
Una Flow Gap es brecha de **flujo operacional** — prioridad alta para ORR aunque cada superficie esté CERTIFIED.

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
| [ORR](../22-implementation/ORR.md) | Puerta binaria tras ORR READY |
