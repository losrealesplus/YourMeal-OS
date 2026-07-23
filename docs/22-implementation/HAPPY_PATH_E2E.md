# Happy Path E2E — primer pedido real

**Hito de Etapa 2 (Level 3→4):** no «CAP-002 terminada», sino:

> **Primer Happy Path sin mocks.**

Cuando este recorrido funcione E2E (un cliente, un tenant), se demuestra que el conocimiento operacional certificado puede ejecutarse de forma íntegra en un sistema real — el verdadero nacimiento de YourMeal OS como plataforma.

---

## Objetivo estratégico

```text
Customer App
    ↓ Connected
    ↓ End-to-End
    ↓ Sin mocks
    ↓ Primer pedido real
    ↓ EatClean produce
    ↓ EatClean entrega
    ↓ Cliente confirma
```

Ese flujo es el puente **Carril B (materialización) → Carril A (FOV)** · Level 4.

Ver [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md).

---

## Por qué este orden

El Happy Path genera la evidencia más densa para FOV.  
Capacidades secundarias pueden seguir en Scaffold.

---

## Secuencia de implementación (Cursor)

| # | Paso | Level | Regla |
|---|------|-------|--------|
| 1 | Autenticación y contexto del cliente | L1 | No tocar UX auth más de lo necesario |
| 2 | Catálogo de platos (`DishRepository` + consulta real) | L2 | Solo lectura · no filtros · no cambiar pantallas |
| 3 | Menú semanal | L2 | Solo conectar oferta |
| 4 | Programación del pedido | L2 | UI existente; estado + persistencia |
| 5 | Resumen del pedido | L2 | Sin modificar layout |
| 6 | Confirmación | L3 | Regla OM Lifecycle — citar referencia |
| 7 | Persistencia Supabase + `audit_log` | L3 | Infra existente |
| 8 | Visualización del pedido confirmado | L3 | Dashboard estados reales |

Cada paso: [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) — *no modifiques diseño / rutas / componentes*.  
Un PR · una Capability · un [nivel de cambio](./PR_CHANGE_LEVELS.md).

---

## Definition of Done (Happy Path)

- [ ] Cliente autenticado con tenant EatClean  
- [ ] Ve menú / platos desde datos reales (sin mock)  
- [ ] Programa y confirma un pedido  
- [ ] Fila Order (+ items) en Supabase  
- [ ] Entrada en `audit_log`  
- [ ] Dashboard muestra pedido confirmado  
- [ ] Knowledge Traceability en services tocados  
- [ ] [Knowledge Coverage](./KNOWLEDGE_COVERAGE.md) actualizado  
- [ ] Ninguna regla nueva fuera del OM  

Producción / entrega pueden ser **mínimas** al inicio (lectura operativa), siempre que el pedido exista y sea visible en la cadena.

---

## Después del primer E2E (Level 4)

1. Usar el flujo en EatClean como escenario FOV (Mission Brief).  
2. Registrar FO-V / FO-E / FO-C / Knowledge Leakage.  
3. Ampliar backlog (Planning · Batch · Delivery) solo con citas OM.  

---

## Relacionado

- [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md)  
- [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md)  
- [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)  
- [PM-001](../21-product-materialization/PM-001-Customer-App.md)
