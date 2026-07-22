# MC-006 — Location Supporting + camino Plan expedito (aparcado)

**Validation Report:** [VR-006](../05-validation-reports/VR-006-generalizacion-healthycorp.md)  
**Fecha:** 2026-07-22  
**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

---

## Problema demostrado

HealthyCorp: destinos (planta · habitación · aula · punto de excursión) y comida urgente el mismo día.

Delivery sigue siendo el hecho correcto; falta destino canónico fino.  
Urgencia se explica con Plan de 1 Order — documentar camino expedito.

---

## Cambio propuesto (borrador)

### 1. Activar Location (Supporting)

Ya **reservado** en level-2. Promover a activo:

- Relaciona: Delivery · Beneficiary · Kitchen · Stock (almacén)  
- **No** Core de espina  
- Checks: ¿destino válido para Delivery?

### 2. Documentar Plan expedito

Order Confirmed urgente → Production Plan (cardinalidad 1) → Batch → Packaging → Delivery  
Sin violar INV-050 · sin Core EmergencyOrder.

### 3. Clarificar residencia de «dieta»

- Alergias / perfil base → Beneficiary (config)  
- Dieta del servicio → Order Item (+ Amend)

### 4. Rechazos

| Concepto | Decisión |
|----------|----------|
| PrescriptionOrder / EmergencyOrder / Ward como Core | Rechazado |
| Redefinir Delivery | Rechazado |

---

**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22
