# Etapa 2 — Cuatro niveles

**No es solo «Implementación».** Es la demostración de que FOPEBA produce software operacional.

---

## Objetivo del proyecto (desde CAP-002)

| Antes | Ahora |
|-------|-------|
| Construir YourMeal OS | **Demostrar que FOPEBA puede producir software operacional de alta calidad** |

El criterio de éxito deja de ser «hay más pantallas / features» y pasa a ser: **el conocimiento certificado se ejecuta de forma íntegra en un sistema real**.

---

## Escala

```text
LEVEL 1 — Infrastructure Connection
        ↓
LEVEL 2 — Capability Connection
        ↓
LEVEL 3 — Operational Workflow
        ↓
LEVEL 4 — Operational Verification
```

---

### LEVEL 1 — Infrastructure Connection

Conectar infraestructura. **No hay negocio. No hay workflows.**

Ejemplos: Auth · Tenant · Repository · Query · Cache.

| CAP | Rol |
|-----|-----|
| **CAP-001** Auth & User Context | ✅ Connected (pertenece aquí) |

---

### LEVEL 2 — Capability Connection

Conectar **capacidades individuales**, cada una independiente.

| CAP | Estado |
|-----|--------|
| CAP-002 Dish Catalog | ▶️ siguiente (solo lectura) |
| CAP-003 Weekly Menu | ⏳ |
| CAP-004 Order Programming | ⏳ |
| CAP-005 Order Summary | ⏳ |

Un PR = una Capability. Sin «ya que estamos…».

---

### LEVEL 3 — Operational Workflow

Ya no se evalúa una Capability aislada. Se evalúa un **proceso operacional**.

```text
Dish → Weekly Menu → Order → Confirmation
```

Aquí entran CAP-006 / CAP-007 y el ensamblaje del Happy Path (aún sin FOV de campo).

---

### LEVEL 4 — Operational Verification

FOPEBA vuelve al centro: evidencia de campo.

```text
Happy Path → Cliente real → EatClean → Producción → Entrega → Feedback → FOV
```

Puente Carril B → Carril A. Ver [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) · [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md).

---

## Hito (no «CAP-002 terminada»)

> **Primer Happy Path sin mocks.**

```text
Usuario autenticado
        ↓
Consulta platos reales
        ↓
Consulta menú real
        ↓
Programa pedido
        ↓
Confirma
        ↓
Persistencia
        ↓
Audit Log
```

Cuando ese recorrido funcione E2E (un cliente, un tenant), YourMeal OS deja de ser colección de capacidades y pasa a ser **plataforma que ejecuta conocimiento certificado**.

---

## Disciplina

> Un PR · una Capability · un [nivel de cambio](./PR_CHANGE_LEVELS.md).

Prohibido el «ya que estamos» (filtros, rediseño de tarjeta, colores, dashboard…).

---

## Relacionado

- [KNOWLEDGE_COVERAGE](./KNOWLEDGE_COVERAGE.md)  
- [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md)  
- [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)
