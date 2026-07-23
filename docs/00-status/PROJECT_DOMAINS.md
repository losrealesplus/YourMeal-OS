# Dominios del proyecto

Cómo explicar YourMeal OS a un ingeniero nuevo.

```text
FOPEBA
│
├── Knowledge
│     ├── Operational Model
│     ├── Evidence
│     └── Gates
│
├── Engineering
│     ├── Foundation
│     ├── ADR
│     ├── Architecture
│     └── Implementation
│
├── Experience
│     ├── Customer Journeys
│     ├── Tenant Experience
│     ├── BrandConfig
│     └── Screens
│
└── Operations
      ├── Smoke
      ├── ORR
      ├── FOV
      └── Knowledge Update
```

| Dominio | Entregable | Pregunta guía |
|---------|------------|---------------|
| **Knowledge** | Operational Model | ¿Qué sabe el sistema? |
| **Engineering** | Código | ¿Está bien implementado? |
| **Experience** | Customer Journeys + Screens | ¿Mi madre podría pedir sin ayuda? |
| **Operations** | Evidencia | ¿Hay evidencia de campo / ORR? |

Experience **no** es conocimiento ni implementación: es el dominio de cómo el usuario final vive el producto (Tenant-Branded · Experience First).

## Cuatro activos que se complementan

| Activo | Aporta |
|--------|--------|
| **FOPEBA** | Método: observaciones → conocimiento verificable |
| **YourMeal OS** | Plataforma operacional reutilizable |
| **Tenant-Branded** | Identidad por empresa sin forks (ADR 0014) |
| **Experience First** | Diseño desde recorridos, no desde la estructura interna |

Si se mantiene la separación, cada nuevo cliente añade principalmente **configuración, contenido y evidencia** — no complejidad estructural.

## Relacionado

- [CURRENT_PHASE](./CURRENT_PHASE.md)  
- [07-experience](../07-experience/README.md)  
- [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md)  
- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)
