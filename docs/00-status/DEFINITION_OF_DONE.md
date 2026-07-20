# Definition of Done — YourMeal OS

Un módulo se considera **DONE** solo si se cumple todo lo siguiente:

| # | Criterio |
|---|----------|
| ✓ | Dominio definido (entidad, estados, lenguaje ubicuo) |
| ✓ | ADR actualizado (si hubo decisión de arquitectura) |
| ✓ | Esquema de base de datos terminado |
| ✓ | Repositorio implementado |
| ✓ | Servicio implementado |
| ✓ | Permisos / capabilities implementados |
| ✓ | Auditoría implementada en mutaciones |
| ✓ | Soft delete respetado (`archive` / `restore` / `purge`) |
| ✓ | Localización respetada (`useFmt`, sin `toLocaleString` en UI de producto) |
| ✓ | Feature flags respetados (si aplica) |
| ✓ | Documentación actualizada (en español) |
| ✓ | Tests pasando (cuando existan en el flujo de trabajo) |
| ✓ | Pull Request fusionado |
| ✓ | Roadmap y estado del proyecto actualizados |

## Regla transversal a todos los módulos

Antes de crear una pantalla deben existir:

1. Entidad  
2. Estados  
3. Reglas de negocio  
4. Servicio  
5. Repositorio  
6. Permisos  
7. Tests básicos (cuando entren en el flujo)

**Solo entonces** se construye la interfaz.

## Orden oficial Module 01 (congelado)

```text
Dish
  → Ingredient
  → Recipe
  → Repositories
  → Services
  → Business Rules
  → Tests
  → UI
  → CRUD
```

La UI es la última pieza.

## Relacionado

- [Estado](./README.md)
- [Foundation Lock](../05-architecture/FOUNDATION_LOCK.md)
- [Roadmap](../roadmap/README.md)
