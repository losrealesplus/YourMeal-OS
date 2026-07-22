# Revisión de consistencia — ciclo completo

**Pregunta gate (antes de 03 · Relationships):**

> ¿Podemos contar el ciclo completo de una operación utilizando **únicamente** Core Objects (Nivel 1) y lenguaje canónico?

**Resultado:** ✅ **Sí** — con matices de Supporting explícitos.

Observation: ⏸ (esta revisión es de coherencia interna del modelo, no evidencia de campo).

---

## Narración canónica (B2B)

1. La **Organization** sirve a una **Company Account**.  
2. Publica un **Weekly Menu** de **Dishes** (cada Dish con **Recipe** de **Ingredients** de un **Supplier**).  
3. Se generan **Orders** para **Beneficiaries**.  
4. Los Orders confirmados alimentan un **Production Plan**.  
5. La cocina ejecuta **Production Batches**.  
6. El resultado entra en **Packaging** por destinatario.  
7. Se planifica una **Delivery Route**.  
8. Cada parada es un **Delivery**.  
9. Según reglas, se registra un **Payment**.

### Variante B2C

Sustituir Company Account + Beneficiary por **Consumer** en los pasos 1 y 3.  
El resto de la espina es idéntico.

---

## Dónde intervienen Supporting (sin romper el relato)

| Momento | Supporting | ¿Imprescindible para narrar? |
|---------|------------|------------------------------|
| Detalle del Order | Order Item | No para el relato; sí para ejecutar |
| ¿Hay materia prima? | Stock | Checks sí; el relato Core sigue en pie |
| Identidad de bolsa | Label | Supporting de Packaging |
| Quién conduce | Vehicle · Employee | Supporting de Route |
| Factura formal | Invoice | Supporting de Payment |

Conclusión: el ciclo se cuenta en Core. Supporting afina ejecución y Checks — no sustituye eslabones.

---

## Huecos conscientes (no inventar Core)

| Candidato | Decisión |
|-----------|----------|
| Stock como Core | Hoy Supporting; promover solo con evidencia |
| Location | Reservado |
| Purchase Order | Futuro / Supporting cuando Purchasing madure |
| Kitchen | Supporting (a menudo 1:1 con Tenant) |

---

## Veredicto

| Criterio | Estado |
|----------|--------|
| Ciclo completo en lenguaje canónico | ✅ |
| Sin «Customer» ambiguo | ✅ |
| Sin Dashboard/KPI en el modelo | ✅ |
| Listo para 03 · Operational Dependencies | ✅ |
| Listo para 04 · Lifecycles | ✅ **siguiente** |

**Siguiente paso permitido:** endurecer [03 · Operational Dependencies](../03-relationships/README.md) — ✅ completado. Siguiente: [04 · Lifecycles](../04-LIFECYCLES.md).

**Siguiente paso no permitido:** añadir Core Objects sin filtro; saltar a código/pantallas; reactivar Observation sin decisión explícita.
