# Four Layers — System Map (YourMeal OS)

> **Status:** Accepted · **Knowledge Lifetime:** Contract  
> **Audience:** Product, Architecture, Operations, FOPEBA observers  
> **Related:** [Foundation Lock](./FOUNDATION_LOCK.md) · [Tenant Branding](./TENANT_BRANDING.md) · [ACT-002 Materialization Frozen](../00-status/ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) · [Pilot Execution Guide](../18-operational-validation/PILOT_EXECUTION_GUIDE.md)

---

## Purpose

Explain YourMeal OS as **four differentiated layers** — without requiring technology talk.

This map supersedes the informal habit of describing the product as “a set of modules.” Modules still exist; they live **inside** these layers.

---

## The map

```text
Knowledge Layer
────────────────
FOPEBA
ADRs
Evidence
Dictionary

↓

Platform Layer
──────────────
RBAC
Core Objects
Capabilities
Services
Repositories

↓

Materialization Layer
─────────────────────
BrandConfig
Branding
Experience
Tenant Assets
Localization

↓

Operational Layer
─────────────────
Weekly Experience
Kitchen
Delivery
Operations
```

---

## Layer responsibilities

| Layer | Question it answers | Frozen v1? |
|-------|---------------------|:----------:|
| **Knowledge** | ¿Qué sabemos y con qué evidencia? | ✅ Methodology · Dictionary · ADRs |
| **Platform** | ¿Qué puede hacer el sistema de forma segura? | ✅ Foundation Lock · Core · RBAC · Services |
| **Materialization** | ¿Cómo se ve y se vive un Tenant concreto? | ✅ Tenant Branding · Experience Baseline · Brand Contract |
| **Operational** | ¿Qué hay que hacer hoy para servir al cliente? | 🟡 Pilot Ready (demostrar, no redesear) |

---

## Why this split matters

| Without layers | With layers |
|----------------|-------------|
| Cada PR parece “otra feature” | Cada PR se clasifica: ¿conocimiento, plataforma, materialización u operación? |
| Branding compite con cocina | Branding materializa; cocina opera |
| FOPEBA se usa para inventar | FOPEBA observa la operación y actualiza conocimiento |
| Éxito = pantallas bonitas | Éxito = una semana real + evidencia |

---

## Flow across layers (pilot)

```text
Knowledge    define qué observar y qué cuenta como evidencia
     ↓
Platform     garantiza capabilities, objetos y persistencia
     ↓
Materialization  hace reconocible al Tenant (EatClean) en cada superficie
     ↓
Operational  ejecuta: pedido → cocina → reparto → cierre
     ↓
Knowledge    FOV → Knowledge Update → Gate
```

Durante el piloto, FOPEBA **no construye**. **Observa.**

---

## Related reading

- [ACT-002 · Foundation of Materialization Frozen](../00-status/ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md)
- [CURRENT_PHASE](../00-status/CURRENT_PHASE.md)
- [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md)
