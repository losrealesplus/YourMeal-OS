# Milestone · EatClean Pilot Ready

**Estado:** 🟡 **Abierto** (oficial)  
**Knowledge Lifetime:** Iteration *(definición del hito; al cerrarse queda inmutable)*  
**Tenant:** EatClean  
**Prerrequisito:** [ACT-001 · Experience Baseline Frozen](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅  
**Criterio único de aceptación:** ver § Criterio de piloto  
**No es:** un PR de UI · un ADR · un reemplazo de ORR/FOV · permiso para pulir estética

> Experiencia base **congelada** (#24→#30 · ACT-001).  
> Foco: **demostrar el ciclo operativo completo con datos reales** y recopilar evidencia FOPEBA.

---

## 1. Objetivo

Demostrar que **Customer App** y **Centro de Operaciones** funcionan como dos caras de una misma operación real sobre YourMeal OS.

```text
Customer Journey
        ↓
Operational Objects
        ↓
Operational Journey
        ↓
Outcome
        ↓
Evidence (FOPEBA)
```

FOPEBA deja de validar solo objetos aislados y demuestra **experiencias operacionales de extremo a extremo**.

---

## 2. Criterio de piloto (Definition of Done)

Una persona que **nunca** ha usado la aplicación debe poder:

1. descubrir el menú de la semana;
2. elegir sus platos;
3. confirmar el pedido;
4. recibir la confirmación;

…mientras el equipo de EatClean, desde el **Centro de Operaciones**, puede **producir y entregar** ese mismo pedido **sin salir de la misma plataforma**, y FOPEBA **recoge evidencia** del recorrido.

Si eso ocurre, el primer tenant ya no es un prototipo: está **listo para un piloto real**.

---

## 3. Entregables (EP)

| ID | Nombre | Pregunta | Cara |
|----|--------|----------|------|
| [EP-001](#ep-001--weekly-experience) | Weekly Experience | ¿El cliente completa un pedido real? | Customer App · CJ-001 |
| [EP-002](#ep-002--kitchen-operations) | Kitchen Operations | ¿La cocina recibe exactamente ese pedido? | OJ · Workspace Cocina |
| [EP-003](#ep-003--delivery-operations) | Delivery Operations | ¿El reparto trabaja con ese pedido? | OJ · Workspace Reparto |
| [EP-004](#ep-004--operational-close) | Operational Close | ¿El pedido se entrega y se cierra? | OJ · cierre |
| [EP-005](#ep-005--evidence-collection) | Evidence Collection | ¿FOPEBA recopila la evidencia del piloto? | Operations · FOV / EC |

Los cinco son necesarios. Ninguno sustituye a ORR: se **alinean** con Smoke → ORR → FOV.

---

### EP-001 · Weekly Experience

**Outcome:** pedido confirmado con menú real del Tenant.

- Menú semanal con nombres · fotografías · macros reales  
- Home viva (próxima entrega con ventana, promoción, favoritos cuando existan)  
- Flujo CJ-001 completo sin ayuda  

Refs: [CJ-001](../07-experience/CUSTOMER_JOURNEYS.md#cj-001--pedido-semanal) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md)

---

### EP-002 · Kitchen Operations

**Outcome:** la cocina recibe exactamente ese pedido.

- Centro de Operaciones → Workspace Cocina  
- Plan / lista del día refleja el pedido del cliente  
- OJ-001 viable  

Refs: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md) · `/admin/production`

---

### EP-003 · Delivery Operations

**Outcome:** el reparto trabaja con ese pedido.

- Workspace Reparto  
- Ruta / paradas coherentes con la entrega programada  
- OJ-002 viable  

Refs: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md) · `/admin/routes`

---

### EP-004 · Operational Close

**Outcome:** el pedido se entrega y se cierra.

- Estado entregado / cerrado en plataforma  
- Cliente y operación comparten el mismo outcome  
- OJ-004 en forma mínima de piloto  

---

### EP-005 · Evidence Collection

**Outcome:** FOPEBA dispone de evidencia usable del piloto.

- Observaciones / FOV alineadas al recorrido E2E (no solo objetos aislados)  
- Hallazgos clasificados (sin “arreglar por intuición”)  
- Entrada al ciclo FOV → Knowledge Update → Gate cuando proceda  

Refs: [FOV Mission Brief](./FOV_MISSION_BRIEF.md) · [Evidence Framework](../20-evidence-framework/README.md) · [CJ001_USAGE_OBSERVATION](../07-experience/CJ001_USAGE_OBSERVATION.md)

---

## 4. Bloque cerrado (#24–#30)

No reabrir como PRs estéticos. Ver [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md).

| PR | Resultado |
|----|-----------|
| #24 | Tenant Experience |
| #25 | ADR-0014 |
| #26 | Experience Refactor |
| #27 | Weekly Menu Experience |
| #28 | Login Experience |
| #29 | Centro de Operaciones + OJ |
| #30 | Brand Continuity Lock · gobernanza docs |

---

## 5. Relación con la línea operativa FOPEBA

| Línea | Pregunta | Artefactos |
|-------|----------|------------|
| Operativa | ¿Hay evidencia para ORR / FOV? | Smoke · ORR · FOV-001 |
| Piloto (este milestone) | ¿El ciclo cliente→entrega funciona y deja evidencia? | EP-001…EP-005 |

No compiten. Un EP puede alimentar FOV; **no** salta el Evidence Gate.

---

## 6. Gobernanza de PRs

- Preferir PRs etiquetados `EP-00x` frente a «UI» / polish.  
- ❌ Cambios estéticos por preferencia (ACT-001).  
- Iteration docs = bitácoras por EP; no reescribir Contract.  
- Al completar EP-001…EP-005 + criterio §2 → este acta **Cerrado** y fila consumada en [MILESTONES](./MILESTONES.md).

---

## 7. Referencias

- [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md)  
- [CURRENT_PHASE](./CURRENT_PHASE.md)  
- [Brand Continuity Locked](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md)  
- [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md)  
- Hipótesis BJ: [BRAND_JOURNEY_HYPOTHESIS](../07-experience/BRAND_JOURNEY_HYPOTHESIS.md)
