# Checks en transiciones

> Los Operational Checks **validan transiciones**, no estados.

Ver [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md) · dependencias en [03](../03-relationships/checks-at-edges.md).

---

## Formato de enunciado

```text
¿Puede [evento] [Objeto]?
```

| Estado (evitar) | Transición (usar) |
|-----------------|---------------------|
| Order Confirmed | ¿Puede **confirmarse** este Order? |
| Batch In Progress | ¿Puede **iniciarse** este Production Batch? |
| Delivery Delivered | ¿Puede **marcarse como entregada**? |
| Payment Settled | ¿Puede **liquidarse** este Payment? |
| Packaging Complete | ¿Puede **completarse** el Packaging? |
| Route Ready | ¿Puede **declararse lista** la Delivery Route? |

---

## Mapa espina → Checks de transición

| Objeto | Transición | Checks típicos |
|--------|------------|----------------|
| Weekly Menu | Publish | Repetición menú · oferta viable |
| Order | Confirm | Completitud · plazo · Menu Published |
| Production Plan | Finalize / Start | Stock · descongelación · demanda |
| Production Batch | Start Production | Stock · descongelación · recetas |
| Production Batch | Complete | Cantidades vs Plan |
| Packaging | Complete | Label · alergias · destinatario |
| Packaging | Hand to route | Asignación a Route |
| Delivery Route | Ready / Depart | Viabilidad ventana · carga |
| Delivery | Confirm Delivered | Destinatario · cobro si aplica |
| Payment | Settle | ¿Debo cobrar? · importe |

---

## Conexión con Capabilities

La Capability **no** define el Check.

Implementa la lectura de precondiciones y la propuesta de acción cuando el Check de transición falla o pasa.

```text
Transición definida (04)
        ↓
Check en esa transición
        ↓
Capability ejecuta / muestra
        ↓
Objetos existentes (02)
```

---

## Anti-patrones

- Check atado a un nombre de pantalla  
- Check que solo dice «estado = X» sin pregunta  
- Check sin acción sugerida post-transición  
- Nuevo objeto Core porque una pantalla lo necesita (viola principio Capabilities)
