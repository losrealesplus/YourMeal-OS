# Etapa 2 / Carril B — YourMeal OS

**Estado:** 🟢 **ABIERTO** (en paralelo a FOV · Carril A)  
**Premisa:** el modelo está **Table-Validated**. El código / UI materializan; no inventan.

Regla dual track: [DUAL_TRACK_ANTECAMARA](../../00-status/DUAL_TRACK_ANTECAMARA.md).  
Materialización: [docs/21-product-materialization](../../21-product-materialization/README.md).

---

## Regla de la Etapa 2

> **¿En qué parte del Operational Model Table-Validated está basada esta decisión?**

Sin respuesta documental → no se implementa.  
Pasa por evidencia (FOV → FER → KU).

---

## Flujo (invertido)

```text
Operational Knowledge → Operational Model → UX Skeleton → Frontend connected → Backend
```

Lovable = arquitecto visual (skeleton ✅).  
**Cursor = ingeniero de materialización** — [22-implementation](../../22-implementation/README.md).

> FOPEBA certifica · Lovable materializa UX · Cursor conecta capacidades certificadas.

### Orden de arranque (Cursor)

1. [IMPLEMENTATION_RULES](../../22-implementation/IMPLEMENTATION_RULES.md)  
2. [Happy Path E2E](../../22-implementation/HAPPY_PATH_E2E.md)  
3. [Backlog](../../22-implementation/IMPLEMENTATION_BACKLOG.md)  

PM UI (histórico): [21](../../21-product-materialization/README.md).

---

## Cuatro fases

| Fase | Nombre | Notas |
|------|--------|-------|
| **A** | Product Experience | Journeys · nav · pantallas base vía **Lovable** · DS |
| **B** | Arquitectura Técnica | Repo · auth · RBAC · CI · DI… |
| **C** | Materialización del Modelo | Lógica con [Knowledge Traceability](./knowledge-traceability.md) |
| **D** | Dependiente de FOV | 🔒 heurísticas · automatizaciones de campo |

---

## Orden de arranque

1. [IA](../PRODUCT_INFORMATION_ARCHITECTURE.md)  
2. [Matriz](../../21-product-materialization/01-screen-knowledge-matrix.md)  
3. **[PM-001](../../21-product-materialization/PM-001-Customer-App.md)** ← siguiente Lovable  
4. PM-002…005 ([SPRINTS](./SPRINTS.md))  
5. Fase C selectiva + [Knowledge Traceability](./knowledge-traceability.md)

---

## Relación con Carril A

Carril B **no** acelera G-01. FOV sigue siendo el juez del conocimiento.
