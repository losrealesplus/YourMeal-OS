# EP-OPS-003 · Evidence Index

**Epic:** [EP_OPS_003](../../00-status/EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md)  
**Prerrequisito:** Entry CERTIFIED (EP-OPS-002)  
**Cadena:** Entry → **Journey** → Flow (G) → Operational Readiness  

```text
Kitchen (Production Ready)          ← CERTIFIED · Gate OBSERVATIONS
    ↓
Delivery (Orders Delivered)         ← NEXT
    ↓
Support (Issues Resolved)
    ↓
Accounting (Financial Records Complete)
```

---

## Gate board

| Orden | Workspace | Outcome | Journey | Validation | Negatives | Gate | Status |
|:-----:|-----------|---------|:-------:|:----------:|:---------:|:----:|--------|
| 1 | [Kitchen](./kitchen.md) | Production Ready | ☑ | ☑ | ☑ | **OBSERVATIONS** | **CERTIFIED** |
| 2 | [Delivery](./delivery.md) | Orders Delivered | □ | □ | □ | — | NOT STARTED |
| 3 | [Support](./support.md) | Issues Resolved | □ | □ | □ | — | NOT STARTED |
| 4 | [Accounting](./accounting.md) | Financial Records Complete | □ | □ | □ | — | NOT STARTED |

Leyenda Gate: `PASS` · `OBSERVATIONS` · `FAIL` · `—`

**Regla de orden:** Delivery puede abrirse — Kitchen Gate cerrado (OBSERVATIONS aceptadas).

---

## Progress EP-OPS-003

```text
Kitchen      ████████████  CERTIFIED · OBSERVATIONS · Production Ready
Delivery     ░░░░░░░░░░░░  NOT STARTED
Support      ░░░░░░░░░░░░  NOT STARTED
Accounting   ░░░░░░░░░░░░  NOT STARTED

Journeys     ███░░░░░░░░░  25%  (1/4)
```

---

## Niveles (no mezclar)

| Nivel | Certifica | Gap típico |
|-------|-----------|------------|
| Entry | Navegación / landing | Entry Gap |
| Journey | Trabajo en el Workspace | Journey Gap |
| Flow | Traspaso entre departamentos | Flow Gap |

---

## Regla P13

No marcar un workspace **CERTIFIED** mientras falte evidencia de su pack.  
No marcar Bloque C **PASS** mientras quede un workspace del alcance sin Gate.  
No fingir Accounting PASS sin operación previa real (No Artificiality).

---

## Pack por workspace

Kitchen evidencia en [kitchen/](./kitchen/). Resto: un `*.md` índice + pack al abrir pasada.
