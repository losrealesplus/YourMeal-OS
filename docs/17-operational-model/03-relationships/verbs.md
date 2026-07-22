# Catálogo de verbos operativos

**Uso:** toda dependencia en el Operational Model debe usar **uno** de estos verbos (forma canónica en inglés; docs en español).

No inventar sinónimos en diagramas (`uses`, `has`, `links`…) sin mapear aquí.

---

## Clasificación por intención

| Clase (ES) | Verbo (EN) | Significado |
|------------|------------|-------------|
| **Publica / ofrece** | `publishes` | Hace disponible una oferta en un período |
| **Coloca / demanda** | `places` | Un actor genera demanda explícita |
| **Contribuye a** | `contributes to` | Aporta necesidad sin ser el agregado |
| **Agrega en** | `aggregates into` | Varias fuentes forman un todo planificado |
| **Cumple** | `fulfills` | El plan responde a la demanda |
| **Utiliza** | `uses` | Consume definición o insumo para calcular |
| **Ejecuta como** | `executes as` | El plan se materializa en ejecución |
| **Produce** | `produces` | La ejecución genera salida operativa |
| **Empaqueta en** | `packages into` | La salida se convierte en unidades por destinatario |
| **Identifica** | `identifies` | Soporte: Label identifica unidad de Packaging |
| **Asigna a** | `assigns to` | Agrupa unidades en logística |
| **Transporta** | `transports` | La ruta mueve unidades en ventana temporal |
| **Realiza** | `performs` | Ejecuta la parada / intento |
| **Confirma** | `confirms` | Atestigua resultado (entregado / fallo / incidencia) |
| **Liquida** | `settles` | Cierra compromiso económico |
| **Requiere** | `requires` | Dependencia de composición (Recipe → Ingredient) |
| **Consume** | `consumes` | Reduce disponible (Stock) |
| **Abastece** | `supplies` | Proveedor → insumo |
| **Compone** | `composes` | Dish ↔ Recipe (estructura) |
| **Ofrece** | `offers` | Menu ofrece Dish en slot |
| **Posee** | `owns` | Organization → objetos del Tenant |
| **Contrata para** | `contracts for` | Company Account → Beneficiaries |
| **Recibe** | `receives` | Beneficiary / Consumer recibe Delivery |
| **Emplea** | `employs` | Route asigna Vehicle (Supporting) |
| **Referencia** | `references` | Order Item → Dish |
| **Documenta** | `documents via` | Invoice documenta Order (Supporting) |

---

## Regla de dirección

Formato canónico:

```text
[Sujeto]  [verbo]  [Objeto]
```

Ejemplos correctos:

```text
Recipe              requires        Ingredient
Production Plan     uses            Recipe
Production Plan     executes as     Production Batch
Production Batch    produces        Packaging
Delivery Route      transports      Packaging
Delivery            confirms        delivery to Consumer / Beneficiary
Payment             settles         Order
```

---

## Verbos prohibidos (vagos)

| Evitar | Usar en su lugar |
|--------|------------------|
| `has` | `owns` · `requires` · `composes` |
| `links to` | verbo específico |
| `relates to` | verbo específico |
| `manages` | Capability, no dependencia operativa |
| `contains` | `aggregates into` · `packages into` |

---

## Pregunta que responde cada clase

| Verbo | Pregunta tipo |
|-------|----------------|
| `publishes` | ¿Qué se puede pedir este período? |
| `places` | ¿Quién generó esta demanda? |
| `aggregates into` | ¿De dónde sale el plan? |
| `fulfills` | ¿Qué demanda cubre el plan? |
| `uses` | ¿Qué definiciones necesita el cálculo? |
| `executes as` | ¿Cómo se cocina el plan? |
| `produces` | ¿Qué sale de cocina? |
| `packages into` | ¿Cómo llega al destinatario? |
| `transports` | ¿Cómo se mueve físicamente? |
| `confirms` | ¿Llegó bien? |
| `settles` | ¿Quedó pagado? |
| `requires` | ¿De qué está hecho? |
| `consumes` | ¿Qué stock se gasta? |
