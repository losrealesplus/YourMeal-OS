# Bloque G · Flow Framing (NOT STARTED)

**Estado:** ⏳ **NOT STARTED** · elegible tras EP-OPS-003 Journeys COMPLETE  
**Acta Journeys:** [EP_OPS_003_JOURNEYS_COMPLETE](../../00-status/EP_OPS_003_JOURNEYS_COMPLETE.md)  
**Metodología Journey:** FROZEN — este documento **no** la modifica  
**Plantilla Flow:** [FLOW_CERTIFICATION](../FLOW_CERTIFICATION.md)

> Framing previo a la apertura de Bloque G.  
> **No** es evidencia de certificación Flow.  
> **No** inicia ejecución de handoffs.

---

## Cambio de pregunta

| Nivel | Pregunta |
|-------|----------|
| Entry (EP-OPS-002) | ¿Aterriza en su Workspace? |
| Journey (EP-OPS-003) | ¿Puede cada Workspace completar su propia misión? |
| **Flow (Bloque G)** | **¿Puede la empresa operar de extremo a extremo?** |

---

## Qué certifica Bloque G

```text
Outcome
  ↓
Department Handoff
  ↓
Next Outcome
  ↓
Operational Flow
```

Certifica la **calidad de las transferencias** entre departamentos — no capacidades individuales ya CERTIFIED en EP-OPS-003.

---

## Handoffs a certificar (contrato)

| From | To | Artefacto transferido | Criterio de calidad (a evidenciar en G) |
|------|----|------------------------|------------------------------------------|
| Kitchen | Delivery | Production Ready | Delivery consume el Outcome sin reopen Kitchen |
| Delivery | Support | Orders Delivered | Support opera sobre entregas reales |
| Support | Accounting | Issues Resolved / eventos financieros | Accounting refleja impacto o continuidad demostrable |
| Accounting | Cierre operativo | Financial Records Complete | Periodo cerrado · cadena E2E trazable |

Flow Gaps ya anotados en packs Journey (FG-*) alimentan esta pasada; no se inventan handoffs nuevos sin evidencia.

---

## Cómo no empezar

| Evitar | Preferir |
|--------|----------|
| Rediseñar pantallas / módulos | Definir y probar handoffs |
| Re-certificar Workspaces | Consumir Outcomes CERTIFIED |
| Ampliar metodología Journey | Aplicar plantilla Flow |
| Abrir G “por inercia” | Decisión explícita + Evidence Gate G |

---

## Precondiciones (cumplidas)

```text
☑ Kitchen CERTIFIED
☑ Delivery CERTIFIED
☑ Support CERTIFIED
☑ Accounting CERTIFIED
☑ EP-OPS-003 Journeys COMPLETE
☐ Apertura explícita Bloque G
```

Hasta la apertura explícita: **NOT STARTED**.
