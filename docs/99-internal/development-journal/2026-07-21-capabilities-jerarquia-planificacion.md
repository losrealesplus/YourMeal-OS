# Jerarquía de planificación — Capabilities

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (planificación del Core)  
Estado: Canónico

---

## ¿Qué es?

Cambio de vocabulario de planificación del Core: dejar de pensar en «módulos» y planificar por **capacidades**.

## ¿Cómo es?

```text
Platform
    ↓
Capabilities
    ↓
Use Cases
    ↓
Domain
    ↓
Infrastructure
```

| Nivel | Ejemplo |
|-------|---------|
| Platform | YourMeal OS |
| Capability | Dish Management |
| Use Case | Create Dish |
| Domain | Reglas que lo hacen posible |
| Infrastructure | Cómo se ejecuta (Supabase, …) |

El empaquetado de código (`src/modules/…`) puede seguir existiendo: es organización de archivos, no la unidad de valor.

## ¿Por qué existe?

El cliente no compra entidades ni repositorios; compra **capacidades operativas**.

Dish Management Application (UC-001…008) ya demostró que una Capability completa puede construirse sin tocar Foundation.

## ¿Para qué sirve?

Planificar el Core en el lenguaje del valor entregado.

## Objetivos

- Planificar por Capabilities, no por «módulos» de carpeta.
- Mantener Use Cases como unidad de diseño.
- Resistir abstracciones prematuras entre Use Cases parecidos.

## Reglas

> **Primero evidencia. Después abstracción. Nunca al revés.**

Si dos Use Cases de la misma Capability se parecen, **no** extraer abstracción automática.

Esperar a que **varias Capabilities distintas** (p. ej. Recipe Management, Inventory Management) demuestren el mismo patrón antes de generalizar.

## Dependencias

- Metodología estable
- Dish Management Application ✅ (evidencia de la primera Capability)

## Futuro

Siguiente Capability cuando el producto lo pida — no por completar un mapa de módulos.

## Decisiones tomadas

1. Vocabulario de planificación = Platform → Capabilities → Use Cases → Domain → Infrastructure.
2. No se crea un nuevo Guidelines: se registra aquí y en AGENTS.
3. Tentación de generalizar Use Cases: resistir hasta evidencia multi-capability.
