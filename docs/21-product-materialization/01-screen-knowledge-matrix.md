# Matriz pantalla → conocimiento operacional

**Regla:** toda pantalla justifica qué conocimiento materializa.

Evidence level actual del OM: **Table-Validated**.

---

## Matriz viva

| Pantalla | Capacidad | Objeto operacional | Referencia OM | Actor |
|----------|-----------|--------------------|---------------|-------|
| Dashboard Cliente | Consultar estado del pedido | Order | `17` Core · Order / Lifecycle | Cliente |
| Menú Semanal | Programar / elegir oferta | Menu · Order | `17` Menu · Order | Cliente |
| Mis pedidos | Historial / seguimiento | Order | Order Lifecycle | Cliente |
| Facturación / cuenta | Consultar cobro | Payment · Account | Payment · Account | Cliente |
| Producción (día) | Ejecutar plan del día | Plan · Batch | Plan · Batch · Checks | Producción |
| Lotes | Gestionar Batch | Batch · Stock/Lot | Batch · Stock | Producción |
| Etiquetas | Identidad de unidad | Packaging · Label | Packaging · Label | Producción |
| Ruta | Ejecutar entregas | Route · Delivery | Route · Delivery | Reparto |
| Entregas / incidencias | Confirmar · registrar excepción | Delivery | Delivery · Dynamics | Reparto |
| Admin Suite | Gobernar operación | Organization · Menu · Account | Org · Config · Capabilities | Administrador |

Completar rutas exactas de archivo en Sprint 2.1 (sin inventar objetos nuevos).

---

## Cómo usar

1. Añadir fila **antes** de pedir la pantalla a Lovable.  
2. Si no hay Capability/Objeto en el OM → **no** crear pantalla (o aparcar hasta evidencia).  
3. Tras Lovable: enlace a ruta de UI en repo cuando exista.  
4. Fase C: cada service/use case cita la misma referencia ([Knowledge Traceability](../15-product/etapa-2/knowledge-traceability.md)).

---

## Anti-patrones

- Pantalla «bonita» sin fila.  
- Capacidad inventada («recomendaciones mágicas», «optimizar ruta IA») = Fase D 🔒.  
- Mezclar Admin + Producción en un dashboard sin anclar objetos.

---

## Relacionado

- [02 Lovable Brief](./02-lovable-brief.md) · [IA](../15-product/PRODUCT_INFORMATION_ARCHITECTURE.md)
