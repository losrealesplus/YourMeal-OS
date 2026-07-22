# Invariants · Consistencia

**Categoría 4** — nada huérfano en la espina.

---

## INV-030 · Packaging requiere Batch

> **Packaging** no puede existir sin **Production Batch** (o porción registrada) que lo origine.

No empaquetado fantasma.

**Checks:** ¿Puede completarse Packaging?

---

## INV-031 · Batch referencia necesidad

> Todo **Production Batch** referencia **qué necesidad cubre** (Plan / Orders / Dish — según granularidad del Tenant).

---

## INV-032 · Order Item dentro de Menu

> Un **Order** solo contiene **Dishes** ofrecidos en el **Weekly Menu** aplicable (salvo excepción documentada por Organization).

**Checks:** ¿Puede confirmarse Order?

---

## INV-033 · Recipe compone Dish

> Toda producción calculada desde **Recipe** asociada al **Dish** del Order / Plan — no cantidades sueltas sin traza.

*(Business Rule: merma % — no es Invariant; es cálculo.)*

---

## INV-034 · Stock no negativo silencioso

> **Stock Available** no puede volverse negativo **sin** evento de ajuste explícito (Adjust).

Los Checks de suficiencia leen Available; no inventan stock.

---

## INV-035 · Label identifica Packaging

> Sin identidad de destinatario (Label Supporting o equivalente), **Packaging** no está **Complete** si el Check de etiquetas está activo para esa Organization.
