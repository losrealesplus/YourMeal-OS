# Filosofía de Producto · YourMeal OS

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (producto)  
Estado: ✅ Incorporada a la constitución

---

## ¿Qué es?

El documento permanente que define el **propósito** de YourMeal OS y el criterio de éxito del producto: impacto operativo en la cocina del cliente, no volumen de features.

## ¿Cómo es?

Vive en `docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md` y se sitúa en la pirámide entre el Contexto Estratégico y el Contexto CTO:

```text
CONTEXTO_ESTRATEGICO…  → ¿Qué empresa estamos construyendo?
FILOSOFIA_DE_PRODUCTO  → ¿Para qué existe el producto y cómo medimos el éxito?
CONTEXTO_CTO.md        → ¿Cómo debe evolucionar técnicamente?
```

Incluye la pregunta obligatoria previa a PR / ADR / feature:

> ¿Hace que una cocina funcione mejor desde el primer día de uso?

## ¿Por qué existe?

El Contexto Estratégico describe el modelo de negocio y el Core. Faltaba un documento explícito que ancle cada decisión de producto al **beneficio operativo observable** para el cliente.

## ¿Para qué sirve?

- Filtrar capacidades antes de modelarlas o implementarlas.
- Evitar medir éxito por pantallas, módulos o complejidad.
- Recordar que EatClean es el primer profesor del Core.
- Guiar revisiones de PR y ADRs con una pregunta única y concreta.

## Objetivos

- Incorporar la filosofía sin abrir una nueva etapa de estrategia.
- Enlazarlo desde AGENTS, índice de docs, DoD y Contexto CTO.
- Mantener el foco de Module 01 en modelar Dish con disciplina.

## Reglas

- Cliente → problema operativo → dominio → Core → implementación → interfaz.
- Sin evidencia de necesidad, no se desarrolla.
- UI es herramienta de trabajo, no decoración.
- Equilibrio: simplicidad usuario · solidez Core · evolución futura.

## Dependencias

- `FOUNDATION.md`
- `CONTEXTO_ESTRATEGICO_PERMANENTE.md`
- Roadmap Maestro v0.1

## Futuro

- Usar la pregunta obligatoria en cada PR de Module 01+.
- Revisar esta filosofía solo si la evidencia operativa de EatClean la contradice.

## Decisiones tomadas

1. La filosofía de producto queda como documento oficial del Core, no como prompt suelto.
2. Se añade a la pirámide de decisión y al Definition of Done.
3. No sustituye al Contexto Estratégico: lo complementa.
