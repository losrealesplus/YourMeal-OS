# 05 — Invariants

**Tipo:** Operational Model · Core Operativo  
**Estado:** 🚧 v0.1 — **siguiente a endurecer**  
**Prerrequisito:** [04 Lifecycles](../04-lifecycles/README.md) ✅  

**Pregunta:** ¿Qué no puede romperse nunca — independientemente de pantalla, API o implementación?

Invariantes = **leyes permanentes** del sistema (no lista suelta de reglas).

Invariantes = reglas permanentes del lenguaje.  
No son features. Si se violan, el sistema miente o la cocina pierde confianza.

---

## Globales

1. **Todo dato operativo pertenece a una Organization (Tenant).**  
2. **Ningún objeto de la espina existe sin traza a demanda o a recurso** (Order, Menu, Stock, Supplier…).  
3. **Un Check nunca decide por la persona** — solo comprueba y propone.  
4. **No hay «Cliente» ambiguo** — siempre Consumidor / Cuenta Empresa / Beneficiario.

---

## Menu → Order

5. Un **Order** solo puede contener Dishes presentes en el **Weekly Menu** aplicable (salvo excepción explícita documentada).  
6. Un Menu **Draft** no genera compromiso de producción.

---

## Order → Production

7. Solo Orders **Confirmed** (o equivalente) alimentan el **Production Plan**.  
8. Un **Production Batch** siempre referencia qué necesidad (Plan / Orders / Dish) cubre.  
9. Un Batch **no es** un Order ni una Recipe.

---

## Stock → Producción

10. La necesidad de Ingredient se calcula desde Recipe (+ merma) × demanda del Plan — no «a ojo» en el Core.  
11. Stock **Available** es la base de los Checks de suficiencia; no se inventa stock negativo silencioso.

---

## Packaging → Delivery

12. No hay Packaging «completo» sin poder identificar destinatario (Label / Order).  
13. Una **Delivery Route** agrupa Deliveries en una **ventana temporal** explícita.  
14. Una **Delivery** confirma destinatario + momento (éxito, fallo o incidencia) — no se da por entregado al «cerrar la ruta» a ciegas.

---

## Payment

15. Un Payment referencia siempre el compromiso económico (Order / Invoice) — no flota suelto.  
16. El estado de cobro debe poder responderse en el momento de Delivery si la Organización cobra en ruta.

---

## Identidad y archivo

17. **Archive ≠ Purge.** Lo operativo se archiva; el purge es excepcional y auditado.  
18. Los nombres de este modelo son canónicos en producto; sinónimos en UI deben mapear aquí.

---

## Relación con Checks

Muchos invariantes se **vigilan** con Operational Checks.

Ejemplo: invariante 10–11 → CHECK stock vs producción.  
Ejemplo: invariante 13 → CHECK viabilidad de ruta.

Si Observation descubre un invariante nuevo, se añade aquí con OF de origen.
