# Cierre de etapa constitucional · Pirámide de decisión

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (gobierno)  
Estado: ✅ Cerrado — inicia construcción de producto

---

## ¿Qué es?

El cierre formal de la fase «forma de construir» y el inicio de la fase «producto». Incluye la **pirámide de decisión** (jerarquía de documentos) y el **principio de valor** para Module 01 en adelante.

## ¿Cómo es?

Jerarquía de resolución de conflictos:

```text
FOUNDATION.md → AGENTS.md → CONTEXTO_ESTRATEGICO → CONTEXTO_CTO → ADRs → Domain Model → Código
```

Regla operativa a partir de Module 01:

> Cada línea de código debe aportar valor al primer cliente (EatClean) o fortalecer el Core para clientes futuros.

## ¿Por qué existe?

Sin jerarquía explícita, el código arrastra decisiones importantes hacia abajo. Sin criterio de valor, el Core crece por anticipación en lugar de por necesidad real.

## ¿Para qué sirve?

- Evitar debates en el nivel equivocado.
- Marcar Module 01 como **prueba de la constitución**, no solo como entrega de Dish.
- Congelar documentación estratégica nueva hasta que el dominio valide o refute la metodología.

## Objetivos

- No abrir más documentos de estrategia hasta validar con Dish / Ingredient / Recipe.
- Si una regla falla en la práctica, evolucionar la metodología (no forzar el dominio a encajar).
- Registrar FOUNDATION.md como ADN reusable de LosReales, no solo de YourMeal OS.

## Reglas

- Conflicto implementación ↔ dominio → gana dominio.
- Conflicto dominio ↔ ADR → primero ADR.
- Conflicto ADR ↔ estrategia → primero estrategia.
- Conflicto estrategia ↔ FOUNDATION → primero filosofía.
- Código sin valor para EatClean ni para el Core → no implementar.

## Dependencias

- Foundation Lock v0.1.0
- Documentos de dominio Module 01 (Dish, Ingredient, Recipe)
- `FOUNDATION.md`, `AGENTS.md`, contextos y ADRs 0010–0012

## Futuro

- Primera sesión de producto: dominio **Dish** en código (`src/modules/dish-library/domain/`), sin UI.
- Tras Dish + Ingredient + Recipe: evaluar si la constitución «superó su primera prueba real».

## Decisiones tomadas

1. La pirámide de decisión queda en `AGENTS.md` como referencia operativa.
2. El principio de valor queda en `AGENTS.md` bajo Module 01+.
3. No se crean nuevos documentos estratégicos hasta completar la validación con dominio.
4. `FOUNDATION.md` se considera activo transversal de LosReales (reutilizable en futuros proyectos).
