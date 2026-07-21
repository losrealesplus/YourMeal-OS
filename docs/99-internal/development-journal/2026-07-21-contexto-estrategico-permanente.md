# Contexto Estratégico Permanente

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Gobierno / estrategia  
Estado: ✅ Regla permanente

---

## ¿Qué es?

Conversión del contexto estratégico de YourMeal OS en un documento permanente del repositorio:

`docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md`

Fija la dirección empresarial y del Core más allá del detalle técnico inmediato.

---

## ¿Cómo es?

Se coloca por encima del contexto operativo (`CONTEXTO_CTO.md`) y por debajo de la constitución global (`FOUNDATION.md`).

```text
FOUNDATION.md
↓
AGENTS.md
↓
CONTEXTO_ESTRATEGICO_PERMANENTE.md
↓
CONTEXTO_CTO.md
↓
ADRs / dominio / implementación
```

---

## ¿Por qué existe?

Porque una parte del criterio de Cursor no es solo técnica: también es estratégica.

Necesitamos que cada decisión futura pueda justificarse desde principios como:

- diseñar para 100 clientes y desarrollar para 1
- EatClean como primer cliente de aprendizaje
- crecimiento por capacidades, no por bifurcaciones
- prioridad al Core frente a herramientas internas o Studio

---

## ¿Para qué sirve?

| Aporta a | Valor |
|----------|--------|
| Cursor | Marco estable para decidir sin reabrir estrategia en cada sesión |
| Producto | Cohesión entre decisiones de negocio y arquitectura |
| Empresa | Base para construir un Core SaaS y no apps aisladas |

---

## Objetivos

**Principal:** fijar la dirección estratégica permanente de YourMeal OS.

**Secundarios:**

- Separar estrategia de operación
- Reforzar el paso de Infrastructure Driven a Domain Driven
- Recordar que el objetivo final es el Core, no solo EatClean como app

---

## Reglas

- No desarrollar por anticipación
- No construir aplicaciones separadas por cliente
- Convertir diferencias entre clientes en capacidades/flags
- La UI es consecuencia del dominio

---

## Dependencias

Necesita: Foundation Lock + ADR 0012.  
Lo utilizan: todas las sesiones futuras de Cursor y la evolución de Module 01+.

---

## Futuro

Mantener este documento vivo cuando cambie la fase estratégica del producto o aparezca Studio como prioridad real.

---

## Decisiones tomadas

- `CONTEXTO_ESTRATEGICO_PERMANENTE.md` se convierte en referencia de estrategia del Core
- `CONTEXTO_CTO.md` queda como resumen operativo
- Cursor debe justificar decisiones futuras también desde estos principios
