# Definition of Done — YourMeal OS

Un módulo se considera **DONE** solo si se cumple todo lo siguiente:

| # | Criterio |
|---|----------|
| ✓ | Dominio definido (entidad, estados, lenguaje ubicuo) |
| ✓ | **Intencionalidad respondida** (qué / cómo / por qué / para qué) |
| ✓ | **Pregunta de producto respondida** ([Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)): ¿hace que una cocina funcione mejor desde el primer día? |
| ✓ | **Entrada en el Diario de Desarrollo** (al terminar / antes de Done) |
| ✓ | ADR actualizado (si hubo decisión de arquitectura) |
| ✓ | Esquema de base de datos terminado |
| ✓ | Repositorio implementado |
| ✓ | Servicio implementado |
| ✓ | Permisos / capabilities implementados |
| ✓ | Auditoría en mutaciones |
| ✓ | Soft delete respetado (`archive` / `restore` / `purge`) |
| ✓ | Localización respetada (`useFmt`) |
| ✓ | Feature flags respetados (si aplica) |
| ✓ | Documentación actualizada (español) |
| ✓ | Tests pasando (cuando existan en el flujo) |
| ✓ | Pull Request fusionado |
| ✓ | Roadmap y estado actualizados |

## Principio de Intencionalidad

> Todo elemento del sistema debe justificar su existencia **antes** de ser implementado.

Preguntas obligatorias: ¿Qué es? ¿Cómo es? ¿Por qué existe? ¿Para qué sirve? ¿Qué problema resuelve? ¿Qué impacto tiene en el sistema?

## Antes de cualquier pantalla

1. Entidad · 2. Estados · 3. Reglas · 4. Servicio · 5. Repositorio · 6. Permisos · 7. Tests básicos (cuando apliquen)

## Orden Module 01 (congelado)

```text
Language → Value Objects → Errors → State Machine → Entity
  → Repository Interface → Domain Service → Application Service
  → Tests → Infrastructure → UI
```

Luego: Ingredient → Recipe con la misma disciplina.

Docs de dominio: [module-01/](../12-domain-model/module-01/).  
Filosofía: [FILOSOFIA_DE_PRODUCTO.md](../05-architecture/FILOSOFIA_DE_PRODUCTO.md).
