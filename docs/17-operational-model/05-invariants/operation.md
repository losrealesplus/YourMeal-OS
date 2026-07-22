# Invariants · Operación

**Categoría 6** — orden inviolable del día a día.

---

## INV-050 · Plan antes de Batch

> No existe **Production Batch** **In progress** sin **Production Plan** en `Ready` o `In execution`.

**Checks:** ¿Puede iniciarse Batch?

---

## INV-051 · Batch antes de Packaging complete

> No existe **Packaging** `Complete` sin **Production Batch** `Completed` (o cantidad parcial registrada) que lo sustente.

---

## INV-052 · Packaging antes de Route

> No existe **Packaging** `Handed to route` sin **Delivery Route** `Ready` o superior que lo acepte.

**Checks:** ¿Puede asignarse a Route?

---

## INV-053 · Route antes de Delivery confirm

> No existe **Delivery** `Delivered` sin **Delivery Route** que haya **partido**.

Ver INV-022.

---

## INV-054 · Checks en transiciones

> Todo **Operational Check** se enuncia sobre una **transición** candidata — no sobre un nombre de estado estático.

**Formato:** ¿Puede [evento] [Objeto]?

---

## INV-055 · Jerarquía respetada

> Ningún diseño de producto, API o pantalla puede priorizar **Capability** sobre **Invariant**.

Si hay conflicto, gana la Constitución.
