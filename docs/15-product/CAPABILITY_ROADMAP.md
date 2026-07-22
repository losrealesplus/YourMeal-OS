# CAPABILITY_ROADMAP — Asistentes ↔ Capabilities

**Tipo:** Product Blueprint (Product Era)  
**Propósito:** no perder el vínculo entre experiencia e implementación  
**No diseña:** entidades, Use Cases, esquemas ni código

```text
Asistente Operativo     ← lo que se compra
        ↓
Capabilities            ← cómo lo implementamos
        ↓
Use Cases → Domain → Infra
```

---

## Mapa

| Asistente Operativo | Capabilities (Core) | Estado orientativo |
|---------------------|---------------------|--------------------|
| **Production** | Dish · Recipe · Orders · Inventory | Dish ✅ (Core); resto ⏳ |
| **Packaging** | Orders · Labels · Customers* | ⏳ |
| **Route / Delivery Builder** | Routes · Drivers · Deliveries · Orders | ⏳ |
| **Delivery** | Deliveries · Drivers · Payments (estado) | ⏳ |
| **Purchasing** | Inventory · Suppliers · Orders · Recipe | ⏳ |
| **Closing** | Inventory · Orders · Production Planning · Incidents | ⏳ |
| **Menu (Weekly)** | Menu · Nutrition · Dish | Dish ✅ parcial; resto ⏳ |
| **Operations (Centro de Control)** | Orquesta Checks de las anteriores | ⏳ (especificación ✅) |

\* «Customers» en sentido de actores de pedido (Consumidor / Beneficiario / Cuenta Empresa) — ver [ACTORS.md](../12-domain-model/ACTORS.md). No usar «Cliente» ambiguo.

---

## Ya construido (Foundation Era → Product Era)

| Capability | Application | Infrastructure | Notas |
|------------|-------------|----------------|-------|
| **Dish Management** | ✅ UC-001…008 | ✅ adaptador | Alimenta Production y Menu; no es el día 04:00 completo |

Dish Management es necesario.

No es el producto que el gerente «abre por la mañana».

Es el catálogo que los Asistentes consumen.

---

## Orden de aparición (hipótesis — validar con EatClean)

No es un compromiso de calendario.

Es una hipótesis de valor sujeta a evidencia de campo:

1. Validar [MOMENTOS_DE_DECISION.md](./MOMENTOS_DE_DECISION.md) en cocina.  
2. Medir qué pregunta duele más (minutos / errores / interrupciones).  
3. Priorizar el Asistente que elimine esa pregunta.  
4. Solo entonces abrir o ampliar Capabilities.

Candidatos frecuentes (sin inventar prioridad cerrada):

- Production Assistant / cierre de producción del día  
- Closing / Purchasing (anticipación 18:00)  
- Packaging Assistant  
- Centro de Control (cuando haya al menos 2–3 fuentes de Checks)

---

## Regla de entrada al roadmap

Una Capability nueva solo entra si:

1. Un Asistente la necesita para eliminar una pregunta; y  
2. EatClean (u otra Organización) aporta evidencia; y  
3. No se puede resolver reutilizando una Capability ya existente; y  
4. Puede responder: **¿qué comprueba, por qué, y qué acción permite?** ([Operational Checks](./OPERATIONAL_CHECKS.md)).

---

## Relacionado

- [06 Capability Mapping (trazabilidad)](../17-operational-model/06-capability-mapping/README.md)
- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md)
- [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md)
- [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md) — Centro de Control
- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [DISH_USE_CASES.md](../14-application/DISH_USE_CASES.md)
- [Estado del proyecto](../00-status/README.md)
