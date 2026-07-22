# Invariants · Temporalidad

**Categoría 3** — el tiempo no retrocede sin evento.

---

## INV-020 · Transiciones explícitas

> Una transición de Lifecycle **nunca** retrocede sin un **evento explícito** documentado (p. ej. Cancel, Void, Adjust).

No «saltos» silenciosos de estado en producto.

**Checks:** validan transición **hacia adelante** — no sustituyen eventos de reversión.

---

## INV-021 · Orden de la espina

> No puede **confirmarse Delivery** antes de que exista **Packaging** entregable asociado al Order.

Orden causal: demanda → plan → batch → packaging → route → delivery → payment.

**Checks:** ¿Puede marcarse como entregada? (precondiciones de cadena)

---

## INV-022 · Delivery antes de Route

> Una **Delivery** no puede **confirmarse** antes de que su **Delivery Route** haya **partido** (`Departed` / `In progress`).

**Checks:** ¿Puede confirmarse entrega?

---

## INV-023 · Production antes de confirmación

> Un **Order** no alimenta **Production Plan** hasta estar **Confirmed** (transición explícita).

Menu **Draft** no compromete producción.

---

## INV-024 · Payment settle después de due

> Un **Payment** no pasa a **Settled** sin transición explícita desde `Due` o `Pending at delivery`.
