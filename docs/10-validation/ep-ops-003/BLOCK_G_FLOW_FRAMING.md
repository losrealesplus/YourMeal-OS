# Bloque G · Flow Framing (NOT STARTED)

**Estado:** ⏳ **NOT STARTED** · elegible tras capa Entry+Journey cerrada  
**Capa cerrada:** [OPERATIONAL_CERTIFICATION_LAYER_CLOSED](../../00-status/OPERATIONAL_CERTIFICATION_LAYER_CLOSED.md)  
**Acta Journeys:** [EP_OPS_003_JOURNEYS_COMPLETE](../../00-status/EP_OPS_003_JOURNEYS_COMPLETE.md)  
**Metodología Journey:** FROZEN — este documento **no** la modifica  
**Plantilla Flow:** [FLOW_CERTIFICATION](../FLOW_CERTIFICATION.md)

> Función de este documento: **fijar el objeto de certificación** de Flow.  
> **No** ejecuta handoffs. **No** es Evidence Gate G.

---

## Cambio de paradigma

| Hasta ahora (Entry · Journey) | A partir de Bloque G |
|-------------------------------|----------------------|
| Actor = departamento | Actor = **organización** |
| Objeto = Workspace / Journey / Outcome | Objeto = **transferencia** entre Outcomes |
| *¿Kitchen funciona?* | *¿Kitchen entrega correctamente a Delivery?* |

```text
Departamento
        ↓
Transferencia   ← objeto de certificación Flow
        ↓
Departamento
```

---

## Cambio de pregunta

| Capa | Pregunta | Estado |
|------|----------|--------|
| Entry | ¿Dónde entra el usuario? | ✅ CERTIFIED |
| Journey | ¿Puede cada departamento completar su trabajo? | ✅ COMPLETE |
| **Flow** | **¿Puede la empresa operar end-to-end?** | ⏳ Pendiente de apertura |

---

## Disciplina (obligatoria)

| Certificar | No certificar |
|------------|---------------|
| **Handoffs operacionales** | Pantallas |
| Evidencia reproducible del traspaso | Componentes UI |
| Consumo correcto del Outcome upstream | APIs de forma aislada |
| Trazabilidad Outcome → Input | Re-certificación de Journeys ya CERTIFIED |

Cada Flow / handoff responde:

```text
¿El Outcome certificado del departamento A
es consumido correctamente por el departamento B
sin pérdida de información,
sin intervención manual indebida
y manteniendo la trazabilidad?
```

Si se mantiene ese criterio, Bloque G **no** es una repetición de EP-OPS-003: es la certificación del sistema operativo empresarial como **cadena coordinada de resultados**.

---

## Handoffs candidatos (objeto fijado)

| Handoff | Certifica |
|---------|-----------|
| Kitchen → Delivery | Production Ready se transfiere correctamente |
| Delivery → Support | Orders Delivered genera trabajo gestionable |
| Support → Accounting | Issues Resolved produce eventos financieros válidos |
| Accounting → Cierre operativo | Financial Records Complete permite cerrar el ciclo empresarial |

```text
Outcome A (CERTIFIED)
        ↓  handoff
Input B
        ↓
Outcome B (CERTIFIED)
```

Flow Gaps (FG-*) de los packs Journey alimentan esta pasada; no se inventan handoffs sin evidencia.

---

## Cómo no empezar

| Evitar | Preferir |
|--------|----------|
| Pantallas / módulos / APIs aisladas | Handoffs con evidencia |
| Re-certificar Workspaces | Consumir Outcomes CERTIFIED |
| Ampliar metodología Journey | Aplicar plantilla Flow |
| Abrir G por inercia | Decisión explícita + Evidence Gate G |

---

## Precondiciones

```text
☑ Entry CERTIFIED
☑ Kitchen · Delivery · Support · Accounting CERTIFIED
☑ EP-OPS-003 Journeys COMPLETE
☑ Capa operacional Entry+Journey CLOSED
☐ Apertura explícita Bloque G
```

Hasta la apertura explícita: **NOT STARTED**.
