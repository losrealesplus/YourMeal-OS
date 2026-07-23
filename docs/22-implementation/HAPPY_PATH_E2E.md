# Happy Path E2E — primer pedido real

**Objetivo estratégico (no es «el MVP completo»):**

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

Ese flujo es el puente **Carril B (materialización) → Carril A (FOV)**.

---

## Por qué este orden

El Happy Path genera la evidencia más densa para FOV.  
Capacidades secundarias pueden seguir en Scaffold.

---

## Secuencia de implementación (Cursor)

| # | Paso | Regla |
|---|------|--------|
| 1 | Autenticación y contexto del cliente | No tocar UX auth más de lo necesario |
| 2 | Catálogo de platos (`DishRepository` + consulta real) | No añadir campos · no cambiar pantallas |
| 3 | Menú semanal | Solo conectar oferta |
| 4 | Programación del pedido | UI existente; estado + persistencia |
| 5 | Resumen del pedido | Sin modificar layout |
| 6 | Confirmación | Regla OM Lifecycle — citar referencia |
| 7 | Persistencia Supabase + `audit_log` | Infra existente |
| 8 | Visualización del pedido confirmado | Dashboard estados reales |

Cada paso: [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) — *no modifiques diseño / rutas / componentes*.

---

## Definition of Done (Happy Path)

- [ ] Cliente autenticado con tenant EatClean  
- [ ] Ve menú / platos desde datos reales (sin mock)  
- [ ] Programa y confirma un pedido  
- [ ] Fila Order (+ items) en Supabase  
- [ ] Entrada en `audit_log`  
- [ ] Dashboard muestra pedido confirmado  
- [ ] Knowledge Traceability en services tocados  
- [ ] Ninguna regla nueva fuera del OM  

Producción / entrega pueden ser **mínimas** al inicio (lectura operativa), siempre que el pedido exista y sea visible en la cadena.

---

## Después del primer E2E

1. Usar el flujo en EatClean como escenario FOV (Mission Brief).  
2. Registrar FO-V / FO-E / FO-C / Knowledge Leakage.  
3. Ampliar backlog (Planning · Batch · Delivery) solo con citas OM.  

---

## Relacionado

- [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md)  
- [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)  
- [PM-001](../21-product-materialization/PM-001-Customer-App.md)
