# Cierre de la fundación del dominio

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (dominio)  
Estado: ✅ Cerrada

---

## ¿Qué es?

El cierre formal de la **fundación del dominio**: la cadena completa desde filosofía hasta el estándar de entidad, de modo que el código deje de ser el inicio del diseño y pase a ser su consecuencia.

## ¿Cómo es?

Secuencia oficial:

```text
FOUNDATION.md
↓
AGENTS.md
↓
CONTEXTO_ESTRATEGICO_PERMANENTE.md
↓
FILOSOFIA_DE_PRODUCTO.md
↓
ACTORS.md
↓
UBIQUITOUS_LANGUAGE.md
↓
ENTITY_GUIDELINES.md
↓
Dish.md
↓
Dish.ts
```

Registrada en la pirámide de `AGENTS.md` y en el estado del proyecto.

## ¿Por qué existe?

Para congelar una decisión transversal: **cómo debe ser una entidad** se resuelve una sola vez en `ENTITY_GUIDELINES.md`. Recipe, Ingredient, Order y el resto del Core no reabren ese debate; lo aplican.

## ¿Para qué sirve?

- Evitar que cada módulo reinventen «qué es una entidad».
- Convertir consistencia en activo a largo plazo del Core.
- Dejar `Dish.ts` como primera materialización, no como experimento de diseño.

## Objetivos

- Declarar cerrada la fundación del dominio.
- Mantener Module 01 como prueba de que la cadena funciona.
- No abrir más documentos de metodología antes de implementar `Dish`.

## Reglas

- El código es consecuencia del diseño.
- Entity Guidelines es el estándar; no se redescuta por entidad.
- Si una entidad futura parece no encajar, se revisa el estándar con ADR — no se inventa una excepción silenciosa.

## Dependencias

- Toda la cadena documental listada arriba
- Lenguaje de dominio Dish ya en código (VOs, errors, state machine)

## Futuro

- Implementar `Dish.ts` bajo Entity Guidelines.
- Repetir el mismo patrón con Ingredient y Recipe.

## Decisiones tomadas

1. La fundación del dominio se considera **cerrada**.
2. `Dish.ts` es la primera consecuencia, no el inicio del diseño.
3. La consistencia del estándar de entidades es un activo estratégico del Core.
