# Invariants · Integridad

**Categoría 5** — vínculos sagrados entre compromisos.

---

## INV-040 · Payment liquida Order

> Todo **Payment** en estado **Settled** liquida (total o parcialmente, según reglas de la Organization) un **Order** identificado.

Si la Organization permite pagos parciales: varios Payment **Settled** sobre un Order — cada uno referenciado; la suma no puede exceder el compromiso sin regla explícita.

**Checks:** ¿Puede liquidarse?

---

## INV-041 · Delivery confirma destinatario

> Una **Delivery** en estado **Delivered** confirma **destinatario correcto** y **momento** — no se infiere solo por cierre de Route.

**Checks:** ¿Puede marcarse como entregada?

---

## INV-042 · Route ventana temporal

> Toda **Delivery Route** tiene **ventana temporal** explícita (fecha/turno). No es un mapa ni un alias de GPS.

**Checks:** viabilidad de ventana.

---

## INV-043 · Check no decide

> Ningún **Operational Check** ejecuta la acción por la persona (compra automática, confirmación automática de Order, etc.).

Invariante de producto alineado con [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md).

---

## INV-044 · Capabilities no definen leyes

> Ninguna **Capability** introduce Invariant nuevo. Solo **consume** la Constitución.

Cambio de ley = cambio de Operational Model + ADR si afecta Domain.
