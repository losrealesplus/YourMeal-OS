# Application Layer

Coordinación de casos de uso. No contiene reglas de dominio ni detalles de infraestructura.

## Estándar

| Documento | Propósito |
|-----------|-----------|
| [APPLICATION_GUIDELINES.md](./APPLICATION_GUIDELINES.md) | Cómo orquesta YourMeal OS un caso de uso |
| [DISH_USE_CASES.md](./DISH_USE_CASES.md) | **Fuente de verdad** — UC-001…UC-008 Dish |
| [use-cases/CreateDishUseCase.md](./use-cases/CreateDishUseCase.md) | Diseño de implementación UC-001 |
| [DishApplication.md](./DishApplication.md) | Puntero histórico → DISH_USE_CASES |

## Flujo

```text
APPLICATION_GUIDELINES
        ↓
DISH_USE_CASES.md   (comportamientos de negocio)
        ↓
CreateDishUseCase / …   (una clase por UC)
        ↓
(DishApplicationService — fachada opcional)
        ↓
Infrastructure adapters
```

## Principio

> Application no toma decisiones de negocio. Coordina decisiones del dominio.

> El código implementa un caso de uso. El Application Service, si existe, es solo el vehículo.
