# Operational Readiness Certification · metodología FCR→ORR

**Estado:** Accepted as working method (Functional Review Mode)  
**No sustituye** el ORR binario de producto ([ORR](../22-implementation/ORR.md) · PASSED / BLOCKED).  
**Complementa:** certifica **superficies**; ORR de producto se habilita como **consecuencia**.

---

## Cadena (con separación Construcción / Certificación)

```text
RI    Raw Insight
 ↓
KC    Knowledge Consolidation
 ↓
SPEC  principios · superficies · políticas
────────────────────────
Construcción
────────────────────────
 ↓
FCR   Functional Completeness Review   ← certificación (no construcción)
 ↓
ORR   Operational Readiness Review     ← ¿puede liberarse el producto?
 ↓
RELEASE
```

| Fase | Naturaleza |
|------|------------|
| RI · KC · SPEC | Conocimiento y definición |
| Construcción | Implementación |
| **FCR** | **Certificación** de experiencia operacional |
| **ORR** | **Certificación** de readiness de producto / piloto |
| RELEASE | Liberación |

FCR no es QA de bugs ni construcción. Produce evidencia operacional para ORR.

---

## Lenguaje consolidado (no negociable en FCR)

| Concepto | Significado | No es |
|----------|-------------|--------|
| **Tenant Surface** `/admin` | Opera un negocio (tenant) | «pantalla de Company Admin» |
| **Platform Surface** `/saas` | Opera la plataforma | «pantalla de SaaS Admin» |
| **Workspace Entry Policy** | Dónde empieza a trabajar | Autorización RBAC |
| **Render Stability Regression** | Clase de defecto de render | El síntoma «titileo» |

Roles futuros (Platform Support, Billing, Operations, Owner) trabajan sobre **Platform Surface** sin redefinir la superficie.

---

## Regla de evidencia · síntoma ≠ causa

> **Nunca registrar un síntoma como si fuera la causa.**

| Incorrecto | Correcto |
|------------|----------|
| Hallazgo: «Titileo» | Clase: Render Stability Regression · Síntoma: titileo · Hipótesis: render loop |

---

## Surface Status (≠ ORR)

Responde solo:

> ¿Cuál es el estado de **esta superficie**?

| Surface Status | Significado |
|----------------|-------------|
| **NOT STARTED** | Sin recorrido FCR |
| **IN REVIEW** | Pasada en curso / P0–P1 abiertos |
| **CERTIFIED** | Criterios Surface Certified cumplidos |
| **REGRESSED** | P0/P1 nuevo tras CERTIFIED |

ORR responde otra pregunta:

> ¿Puede **liberarse el producto** (piloto / HP-001)?

Son preguntas distintas. Surface Status no sustituye ORR.

### Surface Certified — criterios

1. Jornadas de trabajo del alcance recorridas (no solo pantallas abiertas).
2. Acciones del flujo accionadas; columna **Operación completada** = sí donde aplique.
3. No quedan **P0**.
4. No quedan **P1** abiertos (salvo waiver explícito).
5. **P2** listados y aceptados (o corregidos).
6. Evidencia en [FCR Session Log](./FCR_SESSION_LOG.md).

### ORR READY (consecuencia)

Cuando:

```text
Customer Surface   CERTIFIED
Tenant Surface     CERTIFIED
Platform Surface   CERTIFIED
```

→ se habilita automáticamente:

```text
ORR READY
```

ORR deja de ser una actividad manual de «revisar todo otra vez»: es la puerta binaria ([PASSED|BLOCKED](../22-implementation/ORR.md)) alimentada por superficies ya certificadas. El acta ORR sigue siendo el veredicto formal de producto.

---

## Pasada 2 · jornadas de trabajo (no pantallas)

Pregunta única por perfil:

> **¿Puede este usuario terminar su jornada laboral utilizando únicamente YourMeal OS?**

| Respuesta | Lectura |
|-----------|---------|
| **Sí** | Cerca de Surface CERTIFIED |
| **No** | No es «un bug»: es una **brecha operacional** — evidencia que ORR debe capturar |

### Ejemplos de jornada (guía)

**Kitchen**

```text
Llego → Veo qué cocinar → Cambio estados → Finalizo → Salgo
```

**Delivery**

```text
Entro → Veo rutas → Marco entrega → Salgo
```

**Support**

```text
Entro → Busco cliente → Abro pedido → Registro incidencia → Salgo
```

Tabla de perfiles: [FCR_SESSION_LOG · Pasada 2](./FCR_SESSION_LOG.md#pasada-2--siete-perfiles).

| Columna | Pregunta |
|---------|----------|
| Landing | ¿Cumple Workspace Entry Policy? |
| Navegación | ¿La jornada avanza sin callejones? |
| Permisos | ¿Solo su superficie / capabilities? |
| Resultado | ✅ / ⚠+ID / ❌+ID |
| *(en session log)* Operación completada | ¿Terminó el trabajo, no solo abrió UI? |

---

## Anotación · Operational Journey (aún no modelo oficial)

**No ADR / no SPEC todavía** — necesita más evidencia de Pasada 2.

Evolución probable (modelo, no política):

```text
Operational Journey
  → Entry
  → Workspace
  → Actions
  → Completion
  → Exit
```

Reusable por departamento. Formación y onboarding se apoyarán aquí más adelante.

---

## Anotación · capa emergente (sin nombre oficial)

FOPEBA ya gobierna conocimiento operacional. Con FCR/ORC aparece otra capa — **describir, no bautizar aún**:

```text
Operational Knowledge
        ↓
Operational Certification
        ↓
Operational Release
```

Evolución natural de observar → certificar → liberar. No abrir documento FOPEBA formal hasta que Pasada 2 y un ORR lo respalden.

---

## Relación con artefactos

| Artefacto | Rol |
|-----------|-----|
| [FCR_FINDINGS_REGISTER](./FCR_FINDINGS_REGISTER.md) | Hallazgos / brechas operacionales |
| [FCR_SESSION_LOG](./FCR_SESSION_LOG.md) | Evidencia + Operación completada |
| [RBAC_MATRIX_V1](./RBAC_MATRIX_V1.md) | Autorización por superficie |
| [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) | Landings (candidato ADR) |
| [Development Identity Adapter](../20-evidence-framework/11-development-identity-adapter.md) | Identidad en FCR |
| [ORR](../22-implementation/ORR.md) | Puerta binaria PASSED\|BLOCKED tras ORR READY |
