# Etapa 2 / Carril B — YourMeal OS

**Estado:** 🟢 **ABIERTO** (en paralelo a FOV · Carril A)  
**Premisa:** el modelo está **Table-Validated**. El código materializa; no inventa.

Regla dual track: [DUAL_TRACK_ANTECAMARA](../../00-status/DUAL_TRACK_ANTECAMARA.md).

---

## Regla de la Etapa 2

> **¿En qué parte del Operational Model certificado (Table-Validated) está basada esta decisión?**

Si no hay respuesta documental → no se implementa esa lógica.  
Pasa por evidencia (FOV → FER → KU).

---

## Cuatro fases

### Fase A — Product Experience (libre)

- Customer / Employee / Admin / Delivery Journey  
- Navegación completa · jerarquía · menús · accesos · breadcrumbs  
- Wireframes (baja → media fidelidad) · validación de flujos  
- Dashboards (cliente · admin · producción · reparto)  
- Design System (componentes · color · tipo · espacio · estados · iconos · responsive · a11y)

No altera el Operational Model.

### Fase B — Arquitectura Técnica (libre)

Monorepo · módulos · convenciones · servicios · DI · auth · RBAC · observabilidad · eventos · CI/CD · logging.

Infraestructura, no conocimiento operacional nuevo.

### Fase C — Materialización del Modelo (permitida + trazabilidad)

Sí a lógica de dominio **si** cada pieza importante apunta al OM:

```text
DishService → Core Object Dish → docs/17/… 
ConfirmOrderUseCase → Lifecycle Confirm → Operational Dynamics / OD-…
```

Ver [Knowledge Traceability](./knowledge-traceability.md).

### Fase D — Bloqueada hasta FOV

Heurísticas · automatizaciones por excepciones reales · optimización por comportamiento observado · reglas aprendidas · decisiones «inteligentes» dependientes de campo.

---

## Orden de arranque

```text
Product Information Architecture
        ↓
Sprint 2.1 Product Foundation
        ↓
Wireframes / DS / arquitectura técnica
        ↓
Materialización (Fase C) con trazabilidad
```

| Doc | Rol |
|-----|-----|
| [PRODUCT_INFORMATION_ARCHITECTURE](../PRODUCT_INFORMATION_ARCHITECTURE.md) | Primer entregable |
| [SPRINT_2_1](./SPRINT_2_1_PRODUCT_FOUNDATION.md) | Primer sprint |
| [Knowledge Traceability](./knowledge-traceability.md) | Seña de identidad código↔conocimiento |

---

## Relación con Carril A

Carril B **no** acelera G-01.  
FOV sigue siendo el juez del conocimiento.  
Tras Field-Validated, Fase D y motores de espina se reevalúan.
