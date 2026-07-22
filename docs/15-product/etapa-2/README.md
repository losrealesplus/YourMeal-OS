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

## Flujo (no tradicional)

```text
Operational Model
        ↓
Information Architecture
        ↓
Lovable          ← herramienta principal de UI
        ↓
Iteración UX
        ↓
Código (Fase C + Knowledge Traceability)
```

**Figma** = apoyo (interacción compleja · componente · usabilidad · patrón DS).  
No dibujar todas las pantallas en Figma.

Separación de responsabilidades:

> **FOPEBA certifica el conocimiento; Lovable materializa ese conocimiento en una experiencia de producto.**

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

1. [Product Information Architecture](../PRODUCT_INFORMATION_ARCHITECTURE.md) — Actor → Objetivos → Capacidades → Pantallas  
2. [Matriz pantalla↔conocimiento](../../21-product-materialization/01-screen-knowledge-matrix.md)  
3. [Sprint 2.1](./SPRINT_2_1_PRODUCT_FOUNDATION.md) + [Lovable Brief](../../21-product-materialization/02-lovable-brief.md)  
4. Iterar en Lovable · sync repo  
5. Fase C selectiva con trazabilidad  

---

## Relación con Carril A

Carril B **no** acelera G-01. FOV sigue siendo el juez del conocimiento.
