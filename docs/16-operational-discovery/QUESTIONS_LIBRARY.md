# QUESTIONS_LIBRARY — El backlog real del producto

## Propósito

Contener **preguntas**, no funcionalidades.

Cada Capability futura debería eliminar al menos una pregunta de esta biblioteca.

## Alcance

Preguntas oídas o inferidas de Findings en operación real.

## Estructura

| Pregunta | Quién la hace | Frecuencia | Momento | Findings | Estado |
|----------|---------------|------------|---------|----------|--------|
| … | … | Muy alta / Alta / Diaria / … | … | OF-… | Hipótesis / Validada / Cubierta |

**Estados**

- **Hipótesis** — intuición o Blueprint; sin OF suficientes  
- **Validada** — evidencia repetida  
- **Cubierta** — un Asistente / Capability en producción la elimina (marcar cuándo)

## Reglas

- No escribir «módulo de X». Escribir la pregunta tal como la formula la gente.  
- Sin frecuencia + Findings → no priorizar desarrollo.

## Criterios de actualización

Cada vez que un OF aporte o refuerce una pregunta.

## Ejemplos (semilla — validar en campo)

| Pregunta | Quién la hace | Frecuencia | Estado |
|----------|---------------|------------|--------|
| ¿Qué cocino ahora? | Cocina | Muy alta (hipótesis) | Hipótesis |
| ¿Qué debo descongelar? | Cocina | Alta (hipótesis) | Hipótesis |
| ¿Está pagado? | Repartidor | Alta (hipótesis) | Hipótesis |
| ¿Qué falta comprar? | Compras | Diaria (hipótesis) | Hipótesis |
| ¿Qué lleva esta bolsa? | Packaging | Alta | Ejemplo (OF-001) |

Cuando la evidencia lo permita, cambiar «Hipótesis» → «Validada» y rellenar Findings.
