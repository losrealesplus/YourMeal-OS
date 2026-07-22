# 04 — Lifecycles

**Tipo:** Operational Model · Core Operativo  
**Estado:** 🚧 v0.1 — **siguiente a endurecer**  
**Prerrequisito:** [03 Operational Dependencies](../03-relationships/spine-flow.md) ✅  

**Pregunta:** ¿Qué estados atraviesa cada objeto en el flujo operativo?

Hipótesis v0.1. Las máquinas de estado técnicas viven en [STATE_MACHINES.md](../12-domain-model/STATE_MACHINES.md) cuando se implementen. Aquí: **ciclo operativo**.

---

## Weekly Menu

```text
Draft → Published → Locked (opcional) → Archived
```

| Estado | Significado operativo |
|--------|------------------------|
| Draft | Se está componiendo; no genera Orders reales |
| Published | Oferta viva; genera / acepta Orders |
| Locked | Ya no se edita (producción comprometida) |
| Archived | Histórico |

---

## Order

```text
Draft → Confirmed → In production → Packed → Out for delivery → Delivered → Closed
         ↘ Cancelled
```

| Estado | Significado |
|--------|-------------|
| Draft | Aún editable por demanda |
| Confirmed | Compromete producción |
| In production | Cubierto por Plan / Batch |
| Packed | Unidades listas |
| Out for delivery | En Route |
| Delivered | Delivery confirmada |
| Closed | Operación + pago resueltos (o cerrados a conciencia) |
| Cancelled | No produce / no entrega |

---

## Production Plan

```text
Draft → Ready → In execution → Completed → Archived
```

Nace de Orders confirmados (+ Recipe + Merma).  
Alimenta Batches. No sustituye al Batch.

---

## Production Batch

```text
Planned → Ready to cook → In progress → Completed → (Waste / Partial) → Closed
```

| Estado | Significado |
|--------|-------------|
| Planned | En el plan; aún no en fuego |
| Ready to cook | Mise / descongelación OK |
| In progress | Cocina trabajando |
| Completed | Cantidad objetivo alcanzada (o registrada) |
| Closed | Ya no alimenta Packaging pendiente |

---

## Packaging

```text
Pending → In progress → Complete → Handed to route
```

Cruza Batch(es) con Order Items / destinatarios.

---

## Label

```text
Pending → Printed / Issued → Applied → (Void)
```

Sin Label válida, Packaging no debería «completar» si el Check de etiquetas está activo.

---

## Delivery Route

```text
Draft → Ready → Departed → In progress → Completed → Closed
```

| Estado | Significado |
|--------|-------------|
| Ready | Carga + Vehicle + ventana OK (o con Warnings) |
| Departed | Salió |
| Completed | Todas las Deliveries resueltas (ok / incidencia) |

---

## Delivery

```text
Pending → Attempted → Delivered / Failed / Incident → Closed
```

Es el hecho: ¿llegó al destinatario correcto a tiempo?

---

## Payment

```text
Not due → Due → Pending at delivery → Captured / Failed → Settled
```

El momento exacto (anticipo vs contra entrega) es regla de la Organización — el objeto es el mismo.

---

## Stock

```text
Available → Reserved (opcional) → Consumed / Adjusted → (Reorder signal)
```

Stock no «vive» en un único workflow lineal; se mueve con compras, mermas y Batches.  
Los Checks leen **Available vs Need**.

---

## Dish / Recipe / Ingredient

Ciclos de catálogo (Activate / Deactivate / Archive) — ver Domain Module 01.  
En la espina operativa suelen estar **Active** cuando participan en Menu / Plan / Batch.

---

## Disciplina

Un cambio de estado en producto debe:

1. Nombrar el objeto de este modelo;  
2. Tener un motivo operativo;  
3. Preferiblemente eliminar una pregunta o alimentar un Check.
