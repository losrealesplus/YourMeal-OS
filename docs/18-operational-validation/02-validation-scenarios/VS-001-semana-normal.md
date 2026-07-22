# VS-001 — Escenario Hostil 001 · Modificación tardía EatClean

**Estado:** ✅ auditado (mesa)  
**Validation Report:** [VR-001](../05-validation-reports/VR-001-modificacion-tardia-eatclean.md)  
**Clasificación:** **Extended** · severidad 🔁  
**Protocolo:** [audit-protocol.md](./audit-protocol.md)

---

## Objetivo

Intentar **romper** el Operational Model recorriendo la espina completa mediante una modificación tardía de un Order con consecuencias reales en producción, inventario, logística y entrega.

> El objetivo **no** es resolver el problema operativo.  
> Es preguntar: **¿el modelo sigue explicando lo que ocurre?**

---

## Contexto

| | |
|--|--|
| **Organization** | EatClean Tenerife |
| **Momento** | Miércoles 15:42 · producción del jueves a las **16:00** |
| **Estado previo** | Coherente (espina completa planificada, producción **no** iniciada) |

### Situación inicial (coherente)

- Weekly Menu **Published**
- **148** Orders **Confirmed**
- Production Plan **Ready** (generado)
- **9** Production Batches **Planned** / Ready to cook
- Stock **reservado**
- Delivery Route Norte y Sur **Ready** (optimizadas)
- Packaging **Pending**
- Producción **aún no iniciada** (`Plan` no en `In execution` · Batches no `In progress`)

---

## Evento inesperado (15:42)

Company Account (40 Beneficiaries) solicita **modificar** un Order existente:

| Cambio | Detalle |
|--------|---------|
| Líneas | −20 Ensaladas César · +20 Bowls Pollo Teriyaki |
| Ventana | Entrega **1 h antes** |
| Destinatarios | **2 Beneficiaries nuevos** · menú **sin gluten** |
| Forma | **No** cancela · **No** crea Order nuevo · **modifica** el existente |

### Información oculta (operador no conoce; modelo debe poder comprobar)

| Hecho | Implicación |
|-------|-------------|
| Lechuga sobrante | César ↓ no tensiona Stock lechuga |
| Pollo solo para **12** bowls · faltan **8** | Check Stock antes de Batch |
| Proveedor puede entregar pollo a **17:30** | Producción 16:00 vs llegada 17:30 |
| Batch 4 y 5 usan pollo | Varios Batches compiten por Stock (EC-001) |
| Nueva hora rompe optimalidad Ruta Norte | Recálculo Route |
| Packaging no empezó | Lifecycle Packaging intacto |
| Etiquetas sin gluten distintas | Label / alergias |
| Importe ↑ · cobro fin de mes | Payment **Not due** / Invoice · sin cobro en ruta |

### Edge cases simultáneos

modificación tardía · stock insuficiente · Supplier · producción planificada · cambio logístico · alérgenos · precio · Beneficiaries nuevos

---

## Criterio de éxito

> **Cada hallazgo produjo una decisión trazable** (no «cero errores»).

---

## Auditoría — 8 pasos × 6 preguntas

### Paso 1 — Order · modificación

| Pregunta | Respuesta (auditoría) | ¿Coherente? |
|----------|----------------------|-------------|
| Core Objects | Order · Order Item · Company Account · Beneficiary · Weekly Menu · Dish | ✔ |
| Dependency | Actor `places` / Order `references` Dish (vía Item); Company Account `contracts for` Beneficiary | ✔ |
| Transición | **No existe** `Amend Confirmed Order`. Solo Confirm / Cancel | ✗ |
| Check | Debería existir: ¿**Puede modificarse** este Order Confirmado? (plazo · Plan · Stock · Menu · alérgenos) | ✗ (faltante) |
| Invariant | INV-004 · INV-012 · INV-020 · INV-023 · INV-032 · INV-054 | ✔ (aplicables) |
| ¿Concepto nuevo? | **No** Core Object. Sí falta **transición** Amend | No (objeto) / Sí (transición) |

**Notas:** Cancel + nuevo Order **no** describe el evento («modifica uno existente»). Grieta de Lifecycle, no de vocabulario.

---

### Paso 2 — Order → Production Plan

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Order · Production Plan | ✔ |
| Dependency | Orders `aggregate into` Plan · Plan `fulfills` Orders | ✔ |
| Transición | Plan está **Ready**. No hay `Revise Plan` / `Reaggregate`. Solo Finalize / Start Execution | ✗ |
| Check | ¿**Puede revisarse** el Plan Ready tras cambio de demanda? | ✗ (faltante) |
| Invariant | INV-023 · INV-050 · INV-021 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Regeneración total vs parcial = decisión de Capability/Check — el modelo necesita al menos la **transición** de revisión mientras `Ready` y antes de `In execution`.

---

### Paso 3 — Production Plan → Production Batch

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Plan · Production Batch · Dish | ✔ |
| Dependency | Plan `executes as` Batch · Batch referencia necesidad (INV-031) | ✔ |
| Transición | Batch **Planned** / Ready to cook — cambio de cantidad / Dish no documentado. División / retraso no explícitos | ⚠ |
| Check | ¿**Puede ajustarse** Batch Planned? ¿**Puede iniciarse** a las 16:00 con Stock incompleto? | Parcial |
| Invariant | INV-011 · INV-031 · INV-050 · INV-051 | ✔ |
| ¿Concepto nuevo? | No (no hace falta «Batch Split» como objeto) | No |

**Notas:** Explicable como ajustar Batches Planned bajo el mismo Plan (INV-011 intacto) **si** existe evento de revisión. Retrasar Start = no cruzar `Start Production` hasta Check OK (INV-043).

---

### Paso 4 — Batch → Stock

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Production Batch · Stock · Ingredient · Recipe | ✔ |
| Dependency | Batch `consumes` Stock · Recipe `requires` Ingredient | ✔ |
| Transición | Antes de `Ready to cook` → `In progress`: Check Stock | ✔ |
| Check | ¿**Puede iniciarse** producción? → **No** (pollo 12 &lt; 20) · INV-034 | ✔ |
| Invariant | INV-033 · INV-034 · INV-043 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Modelo **explica** el bloqueo. Batch 4 y 5 compitiendo = EC-001 · mismo Check. **Confirmed** en este paso.

---

### Paso 5 — Stock → Supplier

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Stock · Ingredient · **Supplier** (Core) | ✔ |
| Dependency | Supplier `supplies` Ingredient · Receive Stock (support-transitions) | ✔ |
| Transición | Stock Receive (compra) · no requiere nuevo estado de espina | ✔ |
| Check | ¿**Puede cubrirse** el déficit antes de Start? · ETA 17:30 vs 16:00 | ✔ (Check de tiempo) |
| Invariant | INV-034 · INV-043 (humano decide comprar / retrasar) | ✔ |
| ¿Concepto nuevo? | **Purchase Order** ya previsto como Supporting futuro — **no** Core nuevo | No |

**Notas:** Dependency existente. Capability Purchasing orquesta; no define leyes (INV-044). **Confirmed** / Clarified (documentar Receive + ETA en Checks).

---

### Paso 6 — Batch → Packaging

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Label · Order Item · Batch | ✔ |
| Dependency | Batch `produces` Packaging · Label `identifies` Packaging | ✔ |
| Transición | Packaging aún **Pending** — Lifecycle intacto (`Pending` → …) | ✔ |
| Check | ¿**Puede completarse** Packaging? (Label · alergias · destinatario) — INV-035 | ✔ |
| Invariant | INV-030 · INV-035 · INV-051 · INV-052 | ✔ |
| ¿Concepto nuevo? | No (Label ya cubre alérgenos / sin gluten) | No |

**Notas:** 2 Beneficiaries nuevos = alta **Beneficiary** (Core existe) + Labels distintas. **Confirmed**.

---

### Paso 7 — Packaging → Route

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Packaging · Delivery Route · Vehicle · Delivery | ✔ |
| Dependency | Packaging `assigns to` Route · Route `transports` Packaging | ✔ |
| Transición | Routes **Ready**. No hay `Revise Route` / reoptimizar documentado | ✗ |
| Check | ¿**Puede declararse lista** la ruta? (ventana −1 h) · ¿**Puede revisarse** Ready? | Parcial |
| Invariant | INV-042 · INV-052 · INV-053 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Misma grieta de Lifecycle que Plan: estado Ready sin transición de revisión. Autorización = responsable Organization + Check (INV-043).

---

### Paso 8 — Route → Delivery → Payment

| Pregunta | Respuesta | ¿Coherente? |
|----------|-----------|-------------|
| Core Objects | Delivery · Delivery Route · Order · Payment · Invoice (Supporting) | ✔ |
| Dependency | Delivery `confirms` · Payment `settles` Order | ✔ |
| Transición | Delivery Pending válida si ventana/Route actualizadas · Payment **Not due** / Due fin de mes | ✔ |
| Check | ¿**Puede marcarse entregada**? · ¿**Puede liquidarse** ahora? → No (B2B fin de mes) | ✔ |
| Invariant | INV-014 · INV-022 · INV-040 · INV-041 · INV-024 | ✔ |
| ¿Concepto nuevo? | No | No |

**Notas:** Importe ↑ actualiza compromiso Order/Invoice; Payment no exige cobro inmediato. **Confirmed** (Payment). Delivery válida **si** Route revisada — depende del Paso 7.

---

## Resumen de auditoría

| Métrica | Valor |
|---------|-------|
| Pasos auditados | 8 / 8 |
| Pasos con «concepto nuevo» = Core Object | **0** |
| Grietas de Lifecycle / Check faltante | Pasos **1, 2, 7** (y 3 parcial) |
| Pasos Confirmed (modelo explica) | 4, 5, 6, 8 (Payment/Delivery condicionado) |

### Hallazgos trazables

| ID | Hallazgo | Clasificación local |
|----|----------|---------------------|
| H1 | No hay transición **Amend** Order Confirmed | Extended |
| H2 | No hay **Revise** Production Plan en Ready | Extended |
| H3 | Ajuste Batch Planned no explícito | Clarified / Extended menor |
| H4 | Stock insuficiente → Check bloquea Start | Confirmed |
| H5 | Supplier `supplies` + Receive · PO Supporting | Confirmed |
| H6 | Label / Beneficiary / Packaging Pending | Confirmed |
| H7 | No hay **Revise** Delivery Route Ready | Extended |
| H8 | Payment B2B fin de mes · importe | Confirmed |

---

## Dictamen global → VR-001

**Extended** — el escenario **no** obliga a un Core Object nuevo ni refuta un Invariant.  
Obliga a **ampliar Lifecycles** (y Checks asociados) ya existentes.

Ver [VR-001](../05-validation-reports/VR-001-modificacion-tardia-eatclean.md) · [MC-001](../06-model-changes/MC-001-amend-and-revise-transitions.md).

---

## Siguiente

1. Completar [retrospectiva metodológica](../08-methodological-retrospective.md)  
2. Aplicar MC-001 al modelo **solo** tras aprobación  
3. Entonces VS-002
