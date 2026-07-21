# REPEATED_DECISIONS — Decisiones diarias repetitivas

## Propósito

Identificar decisiones que una persona toma **todos los días** y que hoy dependen de memoria, papel o llamadas.

Si se repiten, el sistema debería **ayudar** (diseño fuera de esta carpeta).

## Alcance

Decisiones operativas recurrentes; no decisiones estratégicas de negocio únicas.

## Estructura

| Decisión | Responsable | Momento | Cómo se decide hoy | Riesgo si falla | OF |
|----------|-------------|---------|--------------------|-----------------|-----|
| … | … | … | Memoria / papel / WhatsApp / … | … | … |

## Reglas

- Registrar el **cómo se decide hoy**, no cómo debería decidir el software.  
- Sin OF o sin repetición → no promover a patrón.

## Criterios de actualización

Cuando se observe la misma decisión en ≥2 jornadas o quede claro que es rutinaria.

## Ejemplos (semilla)

| Decisión | Responsable | Momento |
|----------|-------------|---------|
| Qué cocinar primero | Cocina | ~04:00 |
| Qué comprar | Compras | ~16:00 |
| Qué ruta dividir | Logística | ~08:00 |
| Qué descongelar | Cocina / gerente | Antes de cerrar |
| Qué lleva cada bolsa | Packaging | Packaging |

Completar «cómo se decide hoy» con evidencia de campo.
