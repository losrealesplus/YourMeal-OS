# Dominios del proyecto

Cómo explicar YourMeal OS a un ingeniero nuevo.  
**PR #25** consolida este mapa: ya no es solo un repositorio de software — es un sistema con dominios delimitados y **motores de cambio distintos**.

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

| Dominio | Pregunta que responde | Entregable | Evoluciona mediante |
|---------|----------------------|------------|---------------------|
| **Knowledge** | ¿Qué sabemos de la operación? | Operational Model | FOV → Knowledge Update → Gate |
| **Engineering** | ¿Cómo materializamos ese conocimiento? | Código + Arquitectura | ADR + Implementación |
| **Experience** | ¿Cómo vive el usuario esa operación? | Customer Journeys + Screens | Investigación y pruebas de usuarios |
| **Operations** | ¿Qué ocurre en el mundo real? | Evidencia operacional | Smoke → ORR → FOV |

Cada dominio tiene un **motor de cambio** distinto. Eso evita mezclar:

* Un problema de experiencia **no** implica cambiar el Operational Model.  
* Un hallazgo de FOV **no** implica rediseñar la UI si el problema es de conocimiento.  
* Una mejora visual **no** requiere ADR si no modifica la arquitectura.

## Cadena de trazabilidad (Experience ↔ Knowledge)

```text
Customer Journey
        ↓
Screen (SCR)
        ↓
Capability
        ↓
Operational Model
        ↓
Evidence
```

Las pantallas dejan de ser un inventario de vistas: forman parte de una historia de usuario conectada al conocimiento operacional.

## Cuatro activos que se complementan

| Activo | Aporta |
|--------|--------|
| **FOPEBA** | Método: observaciones → conocimiento verificable |
| **YourMeal OS** | Plataforma operacional reutilizable |
| **Tenant-Branded** | Identidad por empresa sin forks (ADR 0014) |
| **Experience First** | Diseño desde recorridos, no desde la estructura interna |

Estabilidad conceptual alcanzada. A partir de aquí el mayor valor **no** es añadir conceptos, sino demostrar el modelo en campo con EatClean: **CJ-001** usable + evidencia útil para FOPEBA = validación de los cuatro dominios.

Si se mantiene la separación, cada nuevo cliente añade principalmente **configuración, contenido y evidencia** — no complejidad estructural.

## Relacionado

- [CURRENT_PHASE](./CURRENT_PHASE.md)  
- [07-experience](../07-experience/README.md) · [PR review Experience](../07-experience/README.md#revisión-de-pr-experience)  
- [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md)  
- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)
