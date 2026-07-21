# APPLICATION_GUIDELINES · Capa de Aplicación

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (Application)  
Estado: ✅ Estándar adoptado — casos de uso Dish pendientes

---

## ¿Qué es?

El estándar oficial de la capa de Aplicación: orquestar casos de uso sin reglas de dominio ni tecnología.

## ¿Cómo es?

- `docs/14-application/APPLICATION_GUIDELINES.md`
- Principio **Application Orchestration** en `FOUNDATION.md`
- Misma disciplina: Guidelines → `<Aggregate>Application.md` → código

## ¿Por qué existe?

Para que Application no se convierta en un segundo dominio ni en un wrapper de Supabase/React.

## ¿Para qué sirve?

- Separar coordinación (Application) de conocimiento (Domain) y acceso (Repository).
- Situar RBAC, auditoría y transacciones en Application.
- Preparar `DishApplication.md` / Service sin contaminar `Dish`.

## Objetivos

- Adoptar el estándar antes de reescribir el `DishService` legado.
- No implementar Application Service en este paso.

## Futuro

```text
DishApplication.md → Application Service → Use Cases → Supabase adapter → UI
```

## Decisiones tomadas

1. Application orquesta; no decide negocio.
2. Errores de dominio se propagan, no se reinterpretan.
3. El servicio legado debe alinearse al estándar, no al revés.
