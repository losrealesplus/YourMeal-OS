# MC-001 — Amend Order Confirmed + Revise Plan/Route Ready

**Validation Report:** [VR-001](../05-validation-reports/VR-001-modificacion-tardia-eatclean.md)  
**Fecha:** 2026-07-22  
**Capa afectada:** Lifecycle (Order · Production Plan · Delivery Route) · Checks en transición · docs 04  
**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

---

## Problema demostrado

VS-001 (EatClean, mié 15:42): modificación de Order Confirmed sin Cancel, con Plan y Routes ya **Ready**, producción no iniciada.

El modelo no puede narrar el evento sin inventar una transición no documentada.

---

## Cambio propuesto

### 1. Order — transición **Amend Confirmed Order**

`Confirmed` → `Confirmed` (mismo estado; evento de modificación de líneas / ventana / destinatarios)

| | |
|--|--|
| **Evento** | Amend Order |
| **Responsable** | Admin Organization · reglas B2B |
| **Precondiciones** | Order Confirmed · **no** `In production` (o regla explícita si parcialmente producible) · Weekly Menu aplicable |
| **Checks** | ¿**Puede modificarse** este Order? (plazo vs Start Plan · Stock proyectado · Dishes en Menu · Beneficiaries / alérgenos · impacto Route) |
| **Postcondiciones** | Order Items actualizados · Order sigue `contributes to` Plan · dispara revisión de Plan si Plan ya Ready |

**No** sustituye Cancel. Cancel permanece para abandono de demanda.

### 2. Production Plan — transición **Revise Plan**

`Ready` → `Ready` (re-agregación) **o** `Ready` → `Draft` → `Ready` (si la Organization exige re-finalizar)

| | |
|--|--|
| **Evento** | Revise Plan |
| **Checks** | ¿**Puede revisarse** el Plan? (¿ya `In execution`? · Batches In progress) |
| **Postcondiciones** | Batches Planned ajustados · Stock proyección actualizada |

Prohibido Revise si `In execution` sin regla de incidencia documentada (futuro VR).

### 3. Delivery Route — transición **Revise Route**

`Ready` → `Ready` (reoptimizar) **o** `Ready` → `Draft` → `Ready`

| | |
|--|--|
| **Evento** | Revise Route |
| **Checks** | ¿**Puede revisarse** la ruta? (ventana · Vehicle · Packaging aún no Handed) |
| **Postcondiciones** | Orden de paradas / ventana actualizados · INV-042 |

### 4. Production Batch (Clarified en docs)

Documentar que Batches en `Planned` / `Ready to cook` **pueden ajustarse** tras Revise Plan (cantidad / Dish) sin nuevo Core Object.  
`In progress` no se «edita» — solo completa / incidencias (futuro).

### 5. Archivos a tocar (cuando se apruebe)

- `docs/17-operational-model/04-lifecycles/spine-transitions.md`  
- `docs/17-operational-model/04-lifecycles/checks-on-transitions.md`  
- `docs/17-operational-model/04-lifecycles/support-transitions.md` (Order Item bajo Amend)  
- Opcional: nota en UL commercial Order («Amend ≠ Cancel»)

**No** crear Core Object. **No** promover Purchase Order a Core en este MC.

---

## Impacto en jerarquía

| Pregunta | Respuesta |
|----------|-----------|
| ¿Toca Invariants? | No modifica texto INV; refuerza INV-020 · INV-054 |
| ¿Nuevos Checks? | Sí — Amend Order · Revise Plan · Revise Route |
| ¿Capabilities? | Orders · Production Planning · Routes consumen las transiciones |

---

## Aprobación

- [x] Revisado contra Constitución  
- [x] Sin violar jerarquía Invariant → Lifecycle → Check → Capability  
- [x] Aplicado en 17-operational-model  

**Estado:** ✅ aplicado
