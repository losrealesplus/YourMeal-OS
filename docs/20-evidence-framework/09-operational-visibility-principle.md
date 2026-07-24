# 09 · Operational Visibility Principle

Parte del [Evidence Framework](./README.md) (FOPEBA).

**DICT:** [DICT-071 · Operational Visibility](../99-reference/PROJECT_DICTIONARY.md#operational-visibility)  
**Relacionado:** [G-02.7 No Artificiality](./08-gate-g02-pilot-readiness.md#g-027--no-artificiality) · [Pilot Integrity](./08-gate-g02-pilot-readiness.md#principio--pilot-integrity)

---

## Principio

> **Ningún elemento visible puede aparentar una capacidad inexistente.**

Forma corta (piloto):

> **Lo que el usuario ve existe. Lo que no existe todavía, no se promete.**

---

## Por qué existe

Durante un piloto, la confianza operativa se rompe más rápido por **humo** (UI que parece capaz) que por un módulo ausente y honesto.

Operational Visibility protege la **calidad de la evidencia**: si el equipo cree que cocina/stock/clientes “funcionan” porque ven listados, FOPEBA observa un experimento contaminado.

```text
Visible ≠ Implementado

Visible + Funciona + Datos reales + RBAC  →  capacidad
Visible + Mock / botón muerto             →  humo (prohibido)
No visible / Feature Flag OFF             →  honesto (permitido)
```

---

## Reglas de superficie

| Si existe… | Entonces… |
|------------|-----------|
| Un botón | Ejecuta la acción esperada |
| Un formulario | Persiste (CREATE / UPDATE / soft DELETE) |
| Un gráfico / KPI | Usa datos reales (nunca simulados como live) |
| Una pantalla | Cumple un objetivo operativo |
| Un módulo en navegación | El flujo es usable de extremo a extremo |
| Un enlace | No lleva a 404 ni a pantalla vacía decorativa |

Tres salidas válidas por elemento visible:

```text
1. Completo (funciona · datos reales · RBAC)
2. Oculto (Feature Flag o fuera de nav)
3. Marcado explícitamente «Próximamente» (sin apariencia de live)
```

Cualquier otra cosa = **humo** = bloquea Pilot Ready para esa superficie.

---

## Relación con No Artificiality (G-02.7)

| Principio | Protege |
|-----------|---------|
| **No Artificiality** | La integridad del Journey y de la evidencia (sin SQL silencioso, bypass, datos inventados) |
| **Operational Visibility** | La integridad de la **interfaz** (sin promesas visuales de capacidades inexistentes) |

Son complementarios:

```text
G-02.7  →  no fingir en el backend / proceso
DICT-071 →  no fingir en la UI
```

---

## Regla permanente de KPIs (acción)

Toda métrica visible debe **responder una pregunta operativa** y **sugerir (o enlazar) una acción**.

| ❌ Dato huérfano | ✔ Pregunta → acción |
|------------------|---------------------|
| Total clientes | ¿Cuántos inactivos 30d? → campaña / contacto |
| Empresas | ¿Empresas sin pedidos esta semana? → contactar |
| Pedidos | ¿Día de menor volumen? → promoción |

Si un KPI no justifica una acción, no pertenece al Dashboard Comercial (puede vivir en un informe analítico fuera del piloto).

---

## Aplicación en RI-001

- Documentado en práctica por [EP-001 Functional Completeness](../00-status/EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md).
- Gate de superficie: [Functional Completeness Review](../00-status/EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md) §0.
- Flags de módulos admin incompletos: `admin_module_*` (ausente = OFF).

---

## No significa

- Cobertura funcional 100 %.
- Ocultar limitaciones conocidas (esas van a Explicit Uncertainty).
- Sustituir ORR / G-02.

Significa: **honestidad de la superficie** mientras el Journey mínimo se demuestra.

---

## Revisión EP-001 (2026-07-24)

Confirmado en revisión de producto:

- Customer Directory = fuente única (Admin · Customer Support · futuro Marketing/CRM).
- KPI rule permanente: toda métrica → pregunta → acción.
- Atención al Cliente = etiqueta EatClean; dominio evolutivo **Customer Success**.
- Communications = motor común antes que WhatsApp.
- Siguiente construcción: [EP-002A](../00-status/EP002A_CUSTOMER_EXPERIENCE_COMPLETION.md) / [EP-002B](../00-status/EP002B_OPERATIONAL_EXECUTION.md).
