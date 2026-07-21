# Application Layer

Coordinación de casos de uso. No contiene reglas de dominio ni detalles de infraestructura.

## Estándar

| Documento | Propósito |
|-----------|-----------|
| [APPLICATION_GUIDELINES.md](./APPLICATION_GUIDELINES.md) | Cómo orquesta YourMeal OS un caso de uso |

## Flujo

```text
APPLICATION_GUIDELINES
        ↓
<Aggregate>Application.md
        ↓
Application Service / Use Cases
        ↓
Infrastructure adapters
```

## Principio

> Application no toma decisiones de negocio. Coordina decisiones del dominio.
