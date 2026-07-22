# Invariants · Propiedad

**Categoría 2** — a quién pertenece siempre.

---

## INV-010 · Pertenencia a Organization

> Todo dato operativo pertenece a **exactamente una** Organization (Tenant).

Sin objetos «globales» de negocio entre Tenants.

---

## INV-011 · Production Batch → Production Plan

> Un **Production Batch** pertenece a **exactamente un** Production Plan (para el horizonte que cubre).

No flota entre planes. No es un Order ni una Recipe.

**Checks:** ¿Puede iniciarse Batch? (Plan en ejecución)

---

## INV-012 · Order → demanda identificada

> Un **Order** pertenece a un actor de demanda (Consumer o Beneficiary) y a un período acotado por **Weekly Menu** aplicable.

---

## INV-013 · Payment → compromiso económico

> Todo **Payment** referencia **al menos un** compromiso económico explícito (Order y/o Invoice Supporting).

No existe Payment huérfano.

**Nota futura:** pagos parciales = varios Payment sobre un Order — sin violar INV-013 si cada Payment referencia el mismo Order.

---

## INV-014 · Delivery → Order / destinatario

> Toda **Delivery** referencia el **Order** (o líneas) y el destinatario (Consumer / Beneficiary) que confirma.

---

## INV-015 · Beneficiary → Company Account

> Todo **Beneficiary** pertenece a **exactamente una** Company Account activa en contexto B2B.
