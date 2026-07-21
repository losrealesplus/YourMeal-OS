# OPERATIONAL_FINDINGS — Diario de campo

## Propósito

Registrar hechos observados en la operación.  
No ideas. No soluciones. No diseños.

## Alcance

Empresas reales (primera: EatClean). Áreas: producción, packaging, reparto, compras, cierre, admin, etc.

## Estructura (plantilla fija)

```text
OF-XXX

Fecha:
Empresa:
Área:
Persona:          (rol; sin datos personales innecesarios)

Observación:      (solo hechos)

Pregunta detectada:
Tiempo aproximado perdido:
Frecuencia:       (esa jornada / estimada)
Impacto:          (Alto | Medio | Bajo)
Evidencia:        (qué se vio / oyó / midió)

Estado:
  Pendiente | Validada | Descartada
```

## Reglas

- Prohibido proponer pantallas, tablas o Capabilities en este archivo.  
- Una observación = un OF.  
- Si reaparece → enlazar en [VALIDATED_PATTERNS.md](./VALIDATED_PATTERNS.md) y actualizar frecuencia en [QUESTIONS_LIBRARY.md](./QUESTIONS_LIBRARY.md).

## Criterios de actualización

Tras cada jornada de observación (o al cierre del día de campo).

## Ejemplos

### OF-001 — Formato (ejemplo ilustrativo hasta evidencia real)

```text
OF-001

Fecha: 2026-07-21
Empresa: EatClean (ejemplo de plantilla)
Área: Packaging
Persona: Operario de packaging

Observación:
El operario tuvo que abrir tres bolsas para comprobar qué cliente correspondía.

Pregunta detectada: ¿Qué lleva esta bolsa?
Tiempo aproximado perdido: ~4 minutos
Frecuencia: esa secuencia, 1 vez observada (ejemplo)
Impacto: Medio
Evidencia: Observación directa (plantilla)

Estado: Pendiente
Nota: Sustituir / archivar con jornadas reales.
```

## Índice

| ID | Empresa | Área | Pregunta | Estado |
|----|---------|------|----------|--------|
| OF-001 | EatClean | Packaging | ¿Qué lleva esta bolsa? | Ejemplo / Pendiente |
