# Dual Track — Carril A (campo) · Carril B (producto)

> **Carril A** = evidencia empírica (FOV…G-01).  
> **Carril B** = **abierto** — materializar conocimiento Table-Validated sin **inventarlo**.

---

## Regla de oro (Carril B / Etapa 2)

```text
❌ No inventar lógica de negocio.
✅ Materializar lógica ya justificada por el Operational Model.
```

Toda lógica implementada debe responder:

> **¿En qué parte del Operational Model (Table-Validated) está basada esta decisión?**

| Respuesta | Acción |
|-----------|--------|
| Cita a Core · Lifecycle · Check · Dynamics · Capability… | ✅ Implementar (+ [Knowledge Traceability](../15-product/etapa-2/knowledge-traceability.md)) |
| «Nos parece mejor…» / «más cómodo…» / «sobre la marcha…» | ❌ Esperar evidencia (FOV → FER → KU) |

> **El código ya no crea conocimiento; el código materializa conocimiento.**

---

## Carril A — Certificación (FASE B ejecución)

```text
FOV → FER → KU → EC → G-01 → Field-Validated
```

Proyecto de campo: [FOV Mission Brief](./FOV_MISSION_BRIEF.md).  
No sustituible por progreso de Carril B.

---

## Carril B — Producto (abierto en cuatro fases)

Detalle: [etapa-2/](../15-product/etapa-2/README.md).

| Fase | Nombre | Libertad |
|------|--------|----------|
| **A** | Product Experience | Libre — **Lovable** principal · Figma apoyo |
| **B** | Arquitectura Técnica | Libre (repo · módulos · auth · RBAC · CI · DI…) |
| **C** | Materialización del Modelo | Permitida **con trazabilidad** al OM |
| **D** | Dependiente de FOV | **Bloqueada** hasta evidencia de campo |

### Fase D — sigue bloqueado

No implementar aún (suelen cambiar tras FOV):

- automatizaciones por excepciones reales;
- optimización de rutas por comportamiento observado;
- heurísticas / reglas aprendidas / «decisiones inteligentes»;
- motores cuya semántica dependa de Knowledge Leakage aún no capturado.

Dish Library / Module 01 (ya validado) = excepción histórica.

---

## Primer movimiento recomendado (ahora)

**Product Skeleton listo.** Lovable = visual. **Cursor = conectar.**

1. [IMPLEMENTATION_RULES](../22-implementation/IMPLEMENTATION_RULES.md)  
2. [Happy Path E2E](../22-implementation/HAPPY_PATH_E2E.md)  
3. [IMPLEMENTATION_BACKLOG](../22-implementation/IMPLEMENTATION_BACKLOG.md)  

```text
No modifiques diseño / UX / rutas / componentes.
Implementa: estado · query · repos · services · hooks · Supabase · audit_log.
```

Puente a Carril A: primer pedido real sin mocks → evidencia FOV.

---

## Relacionado

- [Estado](./README.md) · [Freeze](./04-methodology-frozen.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)
