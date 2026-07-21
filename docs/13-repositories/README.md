# Repositorios

Contratos de persistencia del **dominio**. Las implementaciones viven en Infrastructure.

## Estándar

| Documento | Propósito |
|-----------|-----------|
| [REPOSITORY_GUIDELINES.md](./REPOSITORY_GUIDELINES.md) | Cómo debe ser un Repository en YourMeal OS |
| [DishRepository.md](./DishRepository.md) | Contrato de dominio para Dish |
| [SupabaseDishRepository.md](./SupabaseDishRepository.md) | Adaptador concreto (Infrastructure Validation) |

## Flujo

```text
REPOSITORY_GUIDELINES
        ↓
<Aggregate>Repository.md
        ↓
<Aggregate>Repository.ts   (contrato)
        ↓
Supabase… / Memory… / Fake…
```

## Principio

> El Core permanece estable; la infraestructura puede cambiar.
