# Transiciones de soporte

Supporting objects — transiciones más simples.  
No sustituyen la espina.

---

## Label (Supporting)

`Pending` → `Printed` → `Applied` → `Void`

| Transición | Check en transición |
|------------|---------------------|
| → `Applied` | ¿**Puede aplicarse** la etiqueta? (destinatario · alergias · fecha) |

Vinculado a Packaging **Complete**.

---

## Stock (Supporting)

No es una línea única. Eventos que mueven posición:

| Evento | Efecto |
|--------|--------|
| Receive (compra) | Aumenta Available |
| Reserve (opcional) | Available → Reserved |
| Consume (Batch) | Reduce Available |
| Adjust | Corrección auditada |

| Check en transición | Pregunta |
|---------------------|----------|
| Antes de consumir | ¿**Puede consumirse** este Stock para el Batch? |
| Antes de reservar | ¿**Puede reservarse** para el Plan? |

---

## Dish / Recipe / Ingredient (catálogo)

Transiciones de catálogo (Domain Module 01):

`Draft` → `Active` → `Inactive` → `Archived`

Checks en transición típicos:

- ¿**Puede activarse** este Dish para Weekly Menu?
- ¿**Puede archivarse** sin romper Orders históricos?

---

## Order Item (Supporting)

No tiene máquina independiente de la del Order padre.

Transiciones relevantes solo como parte de Order **Confirm** / **Cancel**.

---

## Invoice (Supporting)

`Draft` → `Issued` → `Paid` → `Void`

Check: ¿**Puede emitirse** factura? (después de reglas contables de la Organization).

Payment **settles** Order; Invoice documenta.
