# Checks en los vínculos

Los **Operational Checks** no viven en objetos aislados.

Viven en **dependencias operativas**: el verbo entre dos conceptos.

Ver [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md).

---

## Espina

| Dependencia | Check ejemplo |
|-------------|----------------|
| Weekly Menu **offers** Dish | Repetición / similitud de menú |
| Actor **places** Order | ¿Pedido completo? |
| Orders **aggregate into** Production Plan | ¿Demanda confirmada antes de planificar? |
| Production Plan **uses** Recipe + Stock | ¿Stock suficiente? ¿Descongelación? |
| Production Plan **executes as** Batch | ¿Batch alineado con plan? |
| Batch **produces** Packaging | ¿Cantidades vs Order? |
| Packaging **assigns to** Route | ¿Todas las bolsas en ruta? |
| Route **transports** unidades | ¿Viabilidad de ventana? |
| Delivery **confirms** destinatario | ¿Entrega correcta? |
| Payment **settles** Order | ¿Debo cobrar? ¿Pendiente? |

---

## Órbita

| Dependencia | Check ejemplo |
|-------------|----------------|
| Recipe **requires** Ingredient | Necesidad calculada (merma) |
| Batch **consumes** Stock | Faltante antes de cocinar |
| Supplier **supplies** Ingredient | — (compras futuras) |
| Label **identifies** Packaging | Alergenos · fecha · destinatario |

---

## Formato de enunciado de Check

```text
CHECK: [Sujeto] [verbo] [Objeto] — [pregunta eliminada]
```

Ejemplo:

```text
CHECK: Production Plan uses Stock — ¿Tenemos suficiente lechuga para mañana?
```

Si un Check no puede enunciarse con verbo canónico → revisar lenguaje o objeto.
